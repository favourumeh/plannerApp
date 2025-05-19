import globalContext from "../../context"
import "./kanban.css"
import { useContext, useState, useEffect } from "react"
import { useQuery, keepPreviousData, useMutation} from "@tanstack/react-query"
import Header from "../header/header"
import ToolBar from "../toolbar/toolbar"
import KanbanColumn from "./kanbanColumn"
import {DndContext} from "@dnd-kit/core"
import Dropdown from "../dropdown"
import AddEntity from "../toolbar/addEntity"
import FilterPage from "../toolbar/filterPage" 
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import HoverText from "./hoverText"
import { fetchKanbanTasks, fetchBreakObjective, mutateEntityRequest } from "../../fetch_entities"

const Kanban = ({sitePage}) => {
    if (sitePage!=="view-kanban") return 
    const {formatDateFields, currentDate, setCurrentDate, handleDayNavigation, 
            handleNotification, handleLogout, isModalOpen} = useContext(globalContext)
    const entityName = "task"
    const [updatedEntity, setUpdatedEntity] = useState([])
    const [updatedEntityIdAndStatus, setUpdatedEntityIdAndStatus] = useState({})
    const [sourceColumn, setSourceColumn] = useState("")
    const [destColumn, setDestColumn] = useState("")
    const [remainingTaskTimeUnits, setRemainingTaskTimeUnits] = useState("hrs")
    const [remainingTaskTime, setRemainingTaskTime] = useState(0) //can be hours or minutes
    const [totalTaskTimeUnits, setTotalTaskTimeUnits] = useState("mins")
    const [totalTaskTime, setTotalTaskTime] = useState(0)

    const columns = [
        {id:"To-Do", title:"To Do"}, 
        {id:"In-Progress", title:"In Progress"}, 
        {id:"Paused", title:"Paused"}, 
        {id:"Completed", title:"Completed"}
    ]
    const selectedDate = new Date(currentDate).toISOString().split("T")[0]
    const {data, isPending, refetch: refetchKanbanContent} = useQuery({
        queryKey: ["kanban-entities", {"entityName":entityName, "selectedDate":selectedDate}],
        queryFn: () => fetchKanbanTasks(selectedDate, handleNotification, handleLogout),
        placeholderData: keepPreviousData, 
        retry: 3,
    })
    const breakObjectiveQuery = useQuery({
        queryKey: ["break-objective"],
        queryFn: () => fetchBreakObjective(handleNotification, handleLogout),
        retry: 3,
    })

    const dndUpdateTaskMutation = useMutation({
        mutationFn: mutateEntityRequest, 
        onSuccess: refetchKanbanContent,
    })

    useEffect(()=> {//autorefetch whenever task is created/updated
        if (!isModalOpen && !isPending) {
            refetchKanbanContent()
        }
    }, [isModalOpen, isPending])

    const tasksShownOnKanban = (task) => {
        const selectedDay = (new Date(currentDate)).toDateString()
        const taskScheduleDate = new Date(task.scheduledStart).toDateString()
        const isTaskScheduledForSelectedDay = taskScheduleDate === selectedDay
        const isTaskFinishedOnSelectedDay = (new Date(task.finish).toDateString() === selectedDay )
        const isTaskScheduledBeforeToday = new Date(taskScheduleDate).getTime() < new Date().getTime()
        const isTodayEqualToSelectedDay = selectedDay === new Date().toDateString()
        const isTaskOutstanding = task.status !== "Completed"
        var outputBool = false
        if ( isTaskScheduledForSelectedDay && isTodayEqualToSelectedDay ) {outputBool = true}
        if ( isTaskFinishedOnSelectedDay ) {outputBool = true}
        if ( isTaskOutstanding && isTaskScheduledForSelectedDay && isTaskScheduledBeforeToday ) {outputBool = true}
        if ( isTaskOutstanding && isTodayEqualToSelectedDay && isTaskScheduledBeforeToday ) {outputBool = true}
        return outputBool
    }

    const tasks = isPending? [{}] : data.tasks
    var entityArr =   tasks.filter(tasksShownOnKanban)
    const breakObjective = breakObjectiveQuery.isPending? {} : breakObjectiveQuery.data.breakObjective

    const calculateTaskTime = () => { //calculate duration of completed/outstanding tasks 
        const relevantTasks = entityArr.filter(task => task.objectiveId!==breakObjective.id)
        const totalTime = relevantTasks.reduce((acc, task) => acc + chooseTaskDuration(task), 0)
        const remainingTime = relevantTasks.reduce((acc, task) => acc + (task.status !== "Completed" ? chooseTaskDuration(task) : 0), 0)
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
    }, [entityArr, isPending])


    const handleDateFieldsAndStatus = (entity) => {
        //automatically adjusts the task fields when a task is dragged from one status column to another 
            let now = new Date( new Date().getTime() - new Date().getTimezoneOffset()*60*1000 )
            if (entity.status==="To-Do") {
                entity.start = null
                entity.finish = null
            }
            if (entity.status==="In-Progress") {
                entity.start = !entity.start? now : entity.start
                entity.finish = null
                entity.duration = null
            }
            if (entity.status==="Completed") {
                entity.start = !!entity.start? entity.start: now
                entity.finish = now
                const durationMS  = new Date(entity.finish).getTime() - new Date(entity.start).getTime() // in MS
                entity.duration  = Math.round(durationMS/(60*1000)) // in Mins
            }
            if (entity.status==="Paused") {
                //create paused task
                entity.wasPaused = true
                const getParentTaskId = () => !!entity.parentTaskId?  entity.parentTaskId : entity.id
                let task = {...entity, "parentTaskId":getParentTaskId(), "start":null, "finish":null, "duration":null}
                dndUpdateTaskMutation.mutate({action:"create", entityName, currentEntity: formatDateFields(task), handleNotification, handleLogout})
                //create completed task
                entity.start = !!entity.start? entity.start: now
                entity.finish = !!entity.finish? entity.finish : now
                const durationMS  = new Date(entity.finish).getTime() - new Date(entity.start).getTime() // in MS
                entity.duration  = Math.round(durationMS/(60*1000)) 
                entity.status = "Completed"
            }
        return entity
    }

    const handleDragEnd = (e) => { //dnd
        const {active, over} = e

        if (!over) return

        const entityId = active.id
        const newStatus = over.id // one of: To-Do, In-Progress, Paused and Completed

        const updatedEntity_ = entityArr.find((entity) => entity.id ===  entityId)
        setSourceColumn(updatedEntity_.status)
        setDestColumn(newStatus)
        setUpdatedEntityIdAndStatus({id:updatedEntity_.id, status:newStatus})
    }
    
    useEffect(() => {
        if (!!updatedEntityIdAndStatus.id && sourceColumn !== destColumn) {
            let updatedEntity_ = entityArr.find((entity) => entity.id ===  updatedEntityIdAndStatus.id)
            // console.log("updatedEntity_:", updatedEntity_)
            updatedEntity_.status = updatedEntityIdAndStatus.status
            updatedEntity_ = handleDateFieldsAndStatus(updatedEntity_)
            updatedEntity_ = formatDateFields(updatedEntity_)
            setUpdatedEntity(updatedEntity_)
        }
    }, [updatedEntityIdAndStatus])

    useEffect(() => {
        if (!!updatedEntityIdAndStatus.id && sourceColumn !== destColumn) {
            setUpdatedEntityIdAndStatus({})
            const newEntity = entityArr.map(entity => entity.id === updatedEntityIdAndStatus.id? updatedEntity : entity)
            entityArr = newEntity // put here to speed up DnD action (but can be removed)
            dndUpdateTaskMutation.mutate( {action:"update", entityName, currentEntity: updatedEntity, handleNotification, handleLogout} )
        }
    }, [updatedEntity])

    const getInfoCardWidth = () => {
        return entityName==="task"? "926.6px": "695px"
    }

    const chooseTaskDuration = (task) => {
        return !!task.duration? task.duration : task.durationEst
    }

    if ( isPending || breakObjectiveQuery.isPending ) return "Loading ..." //note: all hooks (e.g., useEffect) must be before any conditionals such as this

    return (
        <div className="kanban-page">
            <HoverText width={getInfoCardWidth()}/>
            <div className="kanban-page-header"> 
                <Header/>
                <div className="kanban-page-header-2">
                    <button type="button" className="yesterday-btn" onClick={() => handleDayNavigation("previous-day")}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <div className="kanbnan-page-header-2-text">
                        <strong className="kanban-page-title" onClick={()=> setCurrentDate(new Date())} 
                        > 
                            {`Kanban ${entityName}s | ${remainingTaskTime} ${remainingTaskTimeUnits} left (total ${totalTaskTime} ${totalTaskTimeUnits})`} 
                        </strong>
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
                    {columns?.map((column) => 
                        <KanbanColumn 
                            key={column.id}
                            columnId={column.id}
                            columnTitle={column.title}
                            entityArr={entityArr}
                            entityName={entityName}
                            refetchKanbanContent={refetchKanbanContent}/>
                    )}
                </div>
            </DndContext>
        </div>
    )
}

export default Kanban