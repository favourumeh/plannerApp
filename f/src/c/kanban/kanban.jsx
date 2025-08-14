import globalContext from "../../context"
import "./kanban.css"
import { useContext, useState, useEffect } from "react"
import { useQuery, keepPreviousData, useMutation} from "@tanstack/react-query"
import Header from "../header/header"
import ToolBar from "../toolbar/toolbar"
import KanbanColumn from "./kanbanColumn"
import {DndContext} from "@dnd-kit/core"
import AddEntity from "../toolbar/addEntity"
import FilterPage from "../toolbar/filterPage" 
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import HoverText from "./hoverText"
import { fetchKanbanTasks, fetchBreakObjective, mutateEntityRequest } from "../../fetch_entities"

const columns = [
    {id:"To-Do", title:"To Do"}, 
    {id:"In-Progress", title:"In Progress"}, 
    {id:"Paused", title:"Paused"}, 
    {id:"Completed", title:"Completed"}
]

const Kanban = ({sitePage}) => {
    if (sitePage!=="view-kanban") return 
    const {formatDateFields, currentDate, setCurrentDate, handleDayNavigation, 
            handleNotification, handleLogout, isModalOpen} = useContext(globalContext)
    const entityName = "task"
    const [remainingTaskTimeUnits, setRemainingTaskTimeUnits] = useState("hrs")
    const [remainingTaskTime, setRemainingTaskTime] = useState(0) //can be hours or minutes
    const [totalTaskTimeUnits, setTotalTaskTimeUnits] = useState("mins")
    const [totalTaskTime, setTotalTaskTime] = useState(0)

    const selectedDate = new Date(currentDate).toISOString().split("T")[0]
    const {data, isPending, refetch: refetchKanbanContent} = useQuery({ //get all the kanban tasks for the selected date
        queryKey: ["kanban-tasks", {"entityName":entityName, "selectedDate":selectedDate}],
        queryFn: () => fetchKanbanTasks(selectedDate, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
    const breakObjectiveQuery = useQuery({ //get the "break" objective
        queryKey: ["break-objective"],
        queryFn: () => fetchBreakObjective(handleNotification, handleLogout),
        retry: 3,
    })

    const dndUpdateTaskMutation = useMutation({ // update(mutate) the task when it is dnd
        mutationFn: mutateEntityRequest, 
        onSuccess: refetchKanbanContent,
    })

    useEffect(()=> {//autorefetch kanban-tasks query whenever task form is closed (R: to capture changes when task is created/updated)
        if (!isModalOpen && !isPending) {
            refetchKanbanContent()
        }
    }, [isModalOpen, isPending])

    const tasksShownOnKanban = (task) => { // filter the tasks show on the seleced date on the kanban board
        const selectedDay = (new Date(currentDate)).toDateString()
        const taskScheduleDate = new Date(task.scheduledStart).toDateString()
        const isTaskScheduledForSelectedDay = taskScheduleDate === selectedDay
        const isTaskFinishedOnSelectedDay = (new Date(task.finish).toDateString() === selectedDay )
        const isTaskScheduledBeforeToday = new Date(taskScheduleDate).getTime() < new Date().getTime()
        const isTodayEqualToSelectedDay = selectedDay === new Date().toDateString()
        const isTaskStartDateNotScheduledDate = new Date(task.start).toDateString() != new Date().toDateString()

        const isTaskStatusComplete = task.status === "Completed"
        var outputBool = false
        if ( isTaskScheduledForSelectedDay && isTodayEqualToSelectedDay ) {outputBool = true}
        if ( isTaskScheduledForSelectedDay && !isTaskScheduledBeforeToday) {outputBool = true}
        if ( isTaskFinishedOnSelectedDay && isTaskStatusComplete ) {outputBool = true}
        if ( !isTaskStatusComplete && isTaskScheduledForSelectedDay && isTaskScheduledBeforeToday ) {outputBool = true}
        if ( !isTaskStatusComplete && isTodayEqualToSelectedDay && isTaskScheduledBeforeToday ) {outputBool = true}
        if ( isTaskScheduledForSelectedDay && isTodayEqualToSelectedDay && isTaskStartDateNotScheduledDate && !!task.start ) {outputBool = false} // if task is completed early don't show it on its scheduled date
        if ( task.scheduledStart === null ) {outputBool = false}
        return outputBool
    }

    const tasks = isPending? [{}] : data.tasks
    var taskArr =  tasks.filter(tasksShownOnKanban)
    const breakObjective = breakObjectiveQuery.isPending? {} : breakObjectiveQuery.data.breakObjective

    const chooseTaskDuration = (task) => {
        return !!task.duration? task.duration : task.durationEst
    }

    const calculateTaskTime = () => { //calculate duration of completed/outstanding tasks 
        const relevantTasks = taskArr.filter(task => task.objectiveId!==breakObjective.id)
        const totalTime = relevantTasks.reduce((acc, task) => acc + chooseTaskDuration(task), 0)
        const remainingTime = relevantTasks.reduce((acc, task) => acc + (task.status!=="Completed" ? chooseTaskDuration(task) : 0), 0)
        if (totalTime >=60) {
            setTotalTaskTime((totalTime/60).toFixed(2))
            setTotalTaskTimeUnits("hrs")
        } else {
            setTotalTaskTime(totalTime)
            setTotalTaskTimeUnits("mins")
        } 

        if (remainingTime >= 60){
            setRemainingTaskTimeUnits("hrs")
            setRemainingTaskTime((remainingTime/60).toFixed(2))
        } else {
            setRemainingTaskTimeUnits("mins")
            setRemainingTaskTime(remainingTime)
        }
    }

    useEffect(()=> { //calculate duration of completed/outstanding tasks whenever the entityArray changes AND the data is not pending
        if (!isPending) {
            calculateTaskTime()
        }
    }, [taskArr])

    const handleDateFieldsAndStatus = ({task}) => {//automatically adjusts the task fields when a task is dragged from one status column to another 
            let now = new Date( new Date().getTime() - new Date().getTimezoneOffset()*60*1000 )
            if (task.status==="To-Do") {
                task.start = null
                task.finish = null
                task.duration = null
            }
            if (task.status==="In-Progress") {
                task.start = !task.start? now : task.start
                task.finish = null
                task.duration = null
            }
            if (task.status==="Completed") {
                task.start = !!task.start? task.start: now
                task.finish = now
                const durationMS  = new Date(task.finish).getTime() - new Date(task.start).getTime() // in MS
                task.duration  = Math.round(durationMS/(60*1000)) // in Mins
            }
            if (task.status==="Paused") {
                //create paused task
                task.wasPaused = true
                const getParentTaskId = () => !!task.parentTaskId?  task.parentTaskId : task.id
                let completedTask = {...task, "parentTaskId":getParentTaskId(), "start":null, "finish":null, "duration":null}
                dndUpdateTaskMutation.mutate({action:"create", entityName, currentEntity: formatDateFields(completedTask), handleNotification, handleLogout})
                //create completed task
                task.start = !!task.start? task.start: now
                task.finish = !!task.finish? task.finish : now
                const durationMS  = new Date(task.finish).getTime() - new Date(task.start).getTime() // in MS
                task.duration  = Math.round(durationMS/(60*1000)) 
                task.status = "Completed"
            }
        return task
    }

    const handleDragEnd = async (e) => { //dnd
        const {active, over} = e

        if (!over) return

        const draggedTaskId = active.id
        const destColumn = over.id // one of: To-Do, In-Progress, Paused and Completed
        var draggedTask = taskArr?.find( (task) => task.id === draggedTaskId )
        
        if ( draggedTask.status === destColumn ) return

        if ( draggedTask.status !== destColumn ) {
            draggedTask.status = destColumn
            draggedTask = await formatDateFields( handleDateFieldsAndStatus( {task:draggedTask} ) )
            dndUpdateTaskMutation.mutate( {action:"update", entityName, currentEntity: draggedTask, handleNotification, handleLogout} )
        }
    }

    const indicatePageLoad = () => {
        return isPending? <i className="fa fa-spinner" aria-hidden="true"></i> : undefined
    }

    return (
        <div className="kanban-page">
            <HoverText width="926.6px"/>
            <div className="kanban-page-header"> 
                <Header/>
                <div className="kanban-page-header-2">
                    <button type="button" className="yesterday-btn" onClick={() => handleDayNavigation("previous-day")}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <div className="kanbnan-page-header-2-text">
                        <strong className="kanban-page-title" onClick={()=> setCurrentDate(new Date())} 
                        > 
                            {`Kanban ${entityName}s | ${remainingTaskTime} ${remainingTaskTimeUnits} left (total ${totalTaskTime} ${totalTaskTimeUnits})`} 
                        </strong>
                        &nbsp; {indicatePageLoad()}
                    </div>
                    <button type="button" className="tomorrow-btn" onClick={() => handleDayNavigation("next-day")} > <i className="fa fa-arrow-right" aria-hidden="true"> </i> </button>
                </div>
                <ToolBar> 
                    <AddEntity/>
                    <ViewPage/>
                    <RefreshEntities refetch={refetchKanbanContent}/>
                    <FilterPage/>
                </ToolBar>
            </div>
            <DndContext onDragEnd={handleDragEnd}>
                <div className="kanban-page-body">
                    {columns.map((column) => 
                        <KanbanColumn 
                            key={column.id}
                            columnId={column.id}
                            columnTitle={column.title}
                            taskArr={taskArr}
                            entityName={entityName}
                            breakObjective={breakObjective}
                            refetchKanbanContent={refetchKanbanContent}/>
                    )}
                </div>
            </DndContext>
        </div>
    )
}

export default Kanban