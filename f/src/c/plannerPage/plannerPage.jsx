import "./plannerPage.css"
import { useContext, useEffect, useRef, useState } from "react"
import { persistState } from "../../utils/stateUtils"
import Toolbar from "../toolbar/toolbar"
import AddEntity from "../toolbar/addEntity"
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import FilterPage from "../toolbar/filterPage"
import Header from "../header/header"
import "react-datepicker/dist/react-datepicker.css"
import globalContext from "../../context"
import { DateCard } from "./dateCard"
import { fetchPlannerTasks, mutateEntityRequest } from "../../fetch_entities"
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import { DndContext } from "@dnd-kit/core"
import { UnscheduledSidebar } from "./unscheduledSidebar"
import { SettingsBox } from "./settingsBox"
import localPlannerPageContext from "./localPlannerPageContext"

const datetimeToString = (datetime) => {
    return !datetime? null : datetime.toISOString().split("T")[0] 
}

const getDayFromDate = (date) => {
    return !date? null : new Date(date).toLocaleDateString("en-US", { weekday: 'short' })
    }

export function PlannerPage ({sitePage}) {
    if (sitePage !=="view-planner") return null
    const minPlannerBodyHeight = 700 // minimum height of the planner body
    const [ periodStart, setPeriodStart ] = useState( () => persistState( "periodStart", datetimeToString(new Date()), "localStorage" ) )
    const [ periodEnd, setPeriodEnd ] = useState( () => persistState( "periodEnd", datetimeToString(new Date(new Date().setDate( new Date().getDate() + 1 ))), "localStorage" ) ) // end date is a week after start date
    const [ isExpandAllDateCards, setIsExpandAllDateCards ] = useState( () => persistState( "isExpandAllDateCards", true, "localStorage" ) )
    const [ isExpandAllUnscheduledEntities, setIsExpandAllUnscheduledEntities ] = useState( () => persistState("isExpandAllUnscheduledEntities", true, "localStorage") )
    const [ isJustUnscheduledTask, setIsJustUnscheduledTask ] = useState(() => persistState("isJustUnscheduledTask", false, "localStorage") )
    const [ plannerBodyHeight, setPlannerBodyHeight ] = useState(minPlannerBodyHeight)
    const sideBar = useRef(null)
    const scheduledSection = useRef(null)
    const {handleNotification, handleLogout, isModalOpen} = useContext(globalContext)

    //get the tasks for the planner page for the specified period
    const {data: scheduledTasksQuery, isPending:isPendingScheduled, refetch: refetchPlannerTasks} = useQuery({
        queryKey: ["planner-tasks-planner-period", {"start":periodStart, "finish":periodEnd}],
        queryFn: () => fetchPlannerTasks({periodStart, periodEnd, handleNotification, handleLogout}),
        placeholderData: keepPreviousData, 
        retry: 3,
    })

    const tasks = isPendingScheduled?  [] :  scheduledTasksQuery.tasks
    const projects = isPendingScheduled?  [] :  scheduledTasksQuery.taskProjects
    const objectives = isPendingScheduled?  [] :  scheduledTasksQuery.taskObjectives
    const unscheduledTasks = tasks.filter( (task) => !task.scheduledStart )

    useEffect(() => {
        localStorage.setItem("periodStart", JSON.stringify( datetimeToString(new Date(periodStart))))
    }, [periodStart] )

    useEffect(() => {
        localStorage.setItem("periodEnd", JSON.stringify( datetimeToString( new Date(periodEnd) )))
    }, [periodEnd] )
    
    useEffect(() => {
        localStorage.setItem("isExpandAllDateCards", isExpandAllDateCards )
    }, [isExpandAllDateCards] )

    useEffect(() => {
        localStorage.setItem("isExpandAllUnscheduledEntities", isExpandAllUnscheduledEntities )
    }, [isExpandAllUnscheduledEntities] )

    useEffect(() => {
        localStorage.setItem("isJustUnscheduledTask", isJustUnscheduledTask )
    }, [isJustUnscheduledTask] )
    

    // calculate the number of days between periodStart and periodEnd
    function getDaysBetweenDates(date1, date2) {
        if (date2.getTime() < date1.getTime()){return 0}
        const diffTime = Math.abs(date2 - date1)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    const noPeriodDays = getDaysBetweenDates(new Date(periodStart), new Date(periodEnd))

    //create an array of the dates between periodStart and periodEnd )
    const periodDates = (new Date(periodEnd) < new Date(periodStart))? 
        [] 
        : Array.from({ length: noPeriodDays+1 }, (_, i) => {

            let date = new Date(periodStart)
            date.setTime(date.getTime() + i*60*60*24*1000)
            return {id: getDayFromDate(date) + " " +  datetimeToString(date)}
        })

    const dndUpdateTaskMutation = useMutation({ // update(mutate) the task when it is dnd
        mutationFn: mutateEntityRequest, 
        onSuccess: refetchPlannerTasks,
    })

    const handleDragEnd = (e) => { //dnd
        const {active, over} = e
        if (!over) return

        const draggedTask = tasks.find(task=> task.id === active.id)

        if (!!draggedTask.scheduledStart && over.id!=="Unscheduled-Tasks-List") { // dragging tasks within scheduled section
            const oldStartOrScheduledStart  = datetimeToString(new Date(draggedTask.start || draggedTask.scheduledStart))
            var newScheduledStart = over.id.split(" ")[1]
            if (oldStartOrScheduledStart === newScheduledStart) return  // if the task is not dragged to a new date do nothing
        }

        if (draggedTask.status!=="To-Do") {// if the dragged task is not "To-Do" dont allow it to be dropped in a different date
            handleNotification(`The status task being dragged is '${draggedTask.status}' thus it cannot be scheduled retrospectively`, "failure")
            return
        } 

        if (!draggedTask.scheduledStart) { //dragging task from unscheduled section to scheduled section
            if (over.id === "Unscheduled-Tasks-List") return  // if the tasks remains in the unscheduled section do nothing
            var newScheduledStart = over.id.split(" ")[1]
        }

        if (!!draggedTask.scheduledStart && over.id==="Unscheduled-Tasks-List") { //dragging task from scheduled section to unscheduled section
            var newScheduledStart = null
        }

        dndUpdateTaskMutation.mutate({
            action: "update",
            entityName: "task",
            currentEntity: {...draggedTask, scheduledStart: newScheduledStart },
            handleNotification,
            handleLogout
        })
    }

    useEffect(() => { // refetch the entities after creating/updating an entity via form modal
        if (!isModalOpen){
            refetchPlannerTasks()
        }
    }, [isModalOpen])

    useEffect(() => { // dynamically set the height of the planner body based on the max height between the sidebar and the planner content (unscheduled section)
        if (!sideBar.current) return

        const observer = new ResizeObserver((entries) => {
            const sideBarHeight = entries[0].contentRect.height
            const scheduledSectionHeight = scheduledSection.current?.getBoundingClientRect().height
            // console.log("sideBarHeight:", sideBarHeight)
            setPlannerBodyHeight(Math.max(sideBarHeight+10, minPlannerBodyHeight, scheduledSectionHeight)) 
        })

        observer.observe(sideBar.current)
        return () => observer.disconnect() // Cleanup
    }, [])

    const localPLannerPageContextValues = { // To-do move props to context
    }

    return (
        <localPlannerPageContext.Provider value={localPLannerPageContextValues}>
            <div className="planner-page">
                <div className="planner-page-header"> 
                    <Header/>
                    <div className="planner-page-header-2">
                        <div 
                            className="planner-header-"
                            style={{"color": new Date(periodEnd) < new Date(periodStart)? "red": "white" }}
                        >
                            Planner
                        </div>
                    
                    </div>

                    <Toolbar> 
                        <AddEntity/>
                        <ViewPage/>
                        <RefreshEntities refetch={refetchPlannerTasks}/>
                        <FilterPage/>
                    </Toolbar>

                </div>
                <DndContext onDragEnd={handleDragEnd}>
                    <div className="planner-body" style={{minHeight: `${plannerBodyHeight}px`}}> 
                        <div ref={sideBar} className="planner-side-bar" >
                            <SettingsBox 
                                periodStart={periodStart}  
                                setPeriodStart={setPeriodStart}  
                                periodEnd={periodEnd} 
                                setPeriodEnd={setPeriodEnd}  
                                isExpandAllDateCards={isExpandAllDateCards} 
                                setIsExpandAllDateCards={setIsExpandAllDateCards}
                                isJustUnscheduledTask={isJustUnscheduledTask} 
                                setIsJustUnscheduledTask = {setIsJustUnscheduledTask}
                                isExpandAllUnscheduledEntities={isExpandAllUnscheduledEntities}
                                setIsExpandAllUnscheduledEntities={setIsExpandAllUnscheduledEntities}
                            />
                            <UnscheduledSidebar 
                                unscheduledTasks={unscheduledTasks} 
                                projects={projects} 
                                objectives={objectives} 
                                isJustUnscheduledTask={isJustUnscheduledTask}
                                isExpandAllUnscheduledEntities={isExpandAllUnscheduledEntities}
                                refetchPlannerTasks={refetchPlannerTasks}
                            />
                        </div>

                        <div ref={scheduledSection} className="planner-content"> 
                            { periodDates?.map((date, index) => 
                                <DateCard
                                    key={index}
                                    date={date.id}
                                    isPendingScheduled={isPendingScheduled}
                                    tasks={tasks}
                                    projects={projects}
                                    objectives={objectives}
                                    isExpandAllDateCards={isExpandAllDateCards}
                                    refetchPlannerTasks={refetchPlannerTasks}
                                />
                            ) }
                        </div>
                    </div>
                </DndContext>
            </div>
        </localPlannerPageContext.Provider>

    )
}