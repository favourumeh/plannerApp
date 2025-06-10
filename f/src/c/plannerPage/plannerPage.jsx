import "./plannerPage.css"
import { useContext, useEffect, useState } from "react"
import { persistState } from "../../utils/stateUtils"
import Toolbar from "../toolbar/toolbar"
import AddEntity from "../toolbar/addEntity"
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import FilterPage from "../toolbar/filterPage"
import Header from "../header/header"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import globalContext from "../../context"
import { TaskCard } from "./taskCard"
import { DateCard } from "./dateCard"
import { fetchScheduledPlannerTasks, fetchUnscheduledPlannerTasks, mutateEntityRequest } from "../../fetch_entities"
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import { DndContext } from "@dnd-kit/core"


const datetimeToString = (datetime) => {
    return !datetime? null : datetime.toISOString().split("T")[0] 
}

const getDayFromDate = (date) => {
    return !date? null : new Date(date).toLocaleDateString("en-US", { weekday: 'short' })
    }

export function PlannerPage ({sitePage}) {
    if (sitePage !=="view-planner") return null
    const [ periodStart, setPeriodStart ] = useState( () => persistState( "periodStart", datetimeToString(new Date()), "localStorage" ) )
    const [ periodEnd, setPeriodEnd ] = useState( () => persistState( "periodEnd", datetimeToString(new Date(new Date().setDate( new Date().getDate() + 1 ))), "localStorage" ) ) // end date is a week after start date
    const {handleNotification, handleLogout} = useContext(globalContext)

    //get the scheduled tasks for the specified period
    const {data: scheduledTasksQuery, isPending:isPendingScheduled, refetch: refetchScheduledTasks} = useQuery({
        queryKey: ["planner-period", {"start":periodStart, "finish":periodEnd}],
        queryFn: () => fetchScheduledPlannerTasks({periodStart, periodEnd, handleNotification, handleLogout}),
        placeholderData: keepPreviousData, 
        retry: 3,
    })

    const scheduledTasks = isPendingScheduled?  [] :  scheduledTasksQuery.tasks
    const scheduledTasksProjects = isPendingScheduled?  [] :  scheduledTasksQuery.taskProjects
    const scheduledTasksObjectives = isPendingScheduled?  [] :  scheduledTasksQuery.taskObjectives

    const tasks = scheduledTasks
    const projects = scheduledTasksProjects
    const objectives = scheduledTasksObjectives

    useEffect(() => console.log(scheduledTasks), [scheduledTasks])
    // const scheduledTasks = [{description:"task1", scheduledDate:"2025-06-09"}, {description:"task2", scheduledDate: "2025-06-09"} ]
    
    useEffect(() => {
        localStorage.setItem("periodStart", JSON.stringify( datetimeToString(new Date(periodStart))))
    }, [periodStart] )

    useEffect(() => {
        localStorage.setItem("periodEnd", JSON.stringify( datetimeToString( new Date(periodEnd) )))
    }, [periodEnd] )

    // calculate the number of days between periodStart and periodEnd
    function getDaysBetweenDates(date1, date2) {
        if (date2.getTime() < date1.getTime()){return 0}
        const diffTime = Math.abs(date2 - date1)
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    const noPeriodDays = getDaysBetweenDates(new Date(periodStart), new Date(periodEnd))
    // console.log("period days", noPeriodDays)

    //create an array of the dates between periodStart and periodEnd )
    const periodDates = (new Date(periodEnd) < new Date(periodStart))? [] : Array.from({ length: noPeriodDays+1 }, (_, i) => {
        const date = new Date(periodStart)
        date.setDate(date.getDate() + i)
        return {id: getDayFromDate(date) + " " +  datetimeToString(date)}
    })

    // console.log("periodDates", periodDates)

    const dndUpdateTaskMutation = useMutation({ // update(mutate) the task when it is dnd
        mutationFn: mutateEntityRequest, 
        onSuccess: refetchScheduledTasks,
    })

    const handleDragEnd = (e) => { //dnd
        const {active, over} = e

        if (!over) return

        const draggedTask = tasks.find(task=> task.id === active.id)
        const oldScheduledStart  = datetimeToString(new Date(draggedTask.scheduledStart))
        const newScheduledStart = over.id.split(" ")[1]
        if (oldScheduledStart === newScheduledStart) return 

        dndUpdateTaskMutation.mutate({
            action: "update",
            entityName: "task",
            currentEntity: {...draggedTask, scheduledStart: newScheduledStart },
            handleNotification,
            handleLogout
        })
    }


    return (
        <div className="planner-page">
            <div className="planner-page-header"> 
                <Header/>
                <div className="planner-page-header-2">
                    <div 
                        className="planner-header-"
                        style={{"color": new Date(periodEnd) < new Date(periodStart)? "red": "white" }}
                    >
                        Planner:
                    </div>
                        <DatePicker
                            selected={new Date(periodStart)}
                            onSelect={(date) => setPeriodStart(datetimeToString(date))} 
                            onChange={(date) => setPeriodStart(datetimeToString(date)) }
                            dateFormat="yyyy-MM-dd"
                        />
                        <div>
                            <i className="fa fa-arrows-h" aria-hidden="true"></i>
                        </div>
                        <DatePicker
                            selected={new Date(periodEnd)}
                            onSelect={(date) => setPeriodEnd(datetimeToString(date))} 
                            onChange={(date) => setPeriodEnd(datetimeToString(date))}
                            dateFormat="yyyy-MM-dd"
                        />                    
                </div>

                <Toolbar> 
                    <AddEntity/>
                    <ViewPage/>
                    <RefreshEntities refetch={refetchScheduledTasks}/>
                    <FilterPage/>
                </Toolbar>

            </div>
            <DndContext onDragEnd={handleDragEnd}>
                <div className="planner-body"> 
                    <div className="planner-side-bar"> 
                        <div> Unscheduled Tasks </div> 
                        <div></div>
                    </div>

                    <div className="planner-content"> 
                        { periodDates?.map((date, index) => 
                            <DateCard
                                key={index}
                                date={date.id} 
                                tasks={tasks}
                                projects={projects}
                                objectives={objectives}
                                refetchScheduledTasks = {refetchScheduledTasks}
                            />
                        ) }

                    </div>
                </div>
            </DndContext>

        </div>
    )
}