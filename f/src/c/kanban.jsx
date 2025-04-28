import globalContext from "../context"
import "./kanban.css"
import { useContext, useState, useEffect } from "react"
import Header from "./header"
import ToolBar from "./toolbar"
import KanbanColumn from "./kanbanColumn"
import {DndContext} from "@dnd-kit/core"
import Dropdown from "./dropdown"
import AddEntity from "./toolbarContent/addEntity"
import FilterPage from "./toolbarContent/filterPage" 
import ViewPage from "./toolbarContent/viewPage"
import RefreshEntities from "./toolbarContent/refreshEntities"
import HoverText from "./hoverText"

const Kanban = ({sitePage}) => {
    if (sitePage!=="view-kanban") return 
    const {tasks, objectives, projects, handleEntitySubmit, formatDateFields, currentDate, setCurrentDate, handleDayNavigation} = useContext(globalContext)
    const [entityName, setEntityName] = useState("task")
    const [entityArr, setEntityArr] = useState([])
    const [updatedEntity, setUpdatedEntity] = useState([])
    const [updatedEntityIdAndStatus, setUpdatedEntityIdAndStatus] = useState({})
    const [sourceColumn, setSourceColumn] = useState("")
    const [destColumn, setDestColumn] = useState("")
    const [remainingTaskTimeUnits, setRemainingTaskTimeUnits] = useState("hrs")
    const [remainingTaskTime, setRemainingTaskTime] = useState(0) //can be hours or minutes
    const [totalTaskTime, setTotalTaskTime] = useState(0)

    const [columns, setColumns] = useState([
        {id:"To-Do", title:"To Do"}, 
        {id:"In-Progress", title:"In Progress"}, 
        {id:"Paused", title:"Paused"}, 
        {id:"Completed", title:"Completed"}
    ])

    const tasksShownOnKanban = (task) => {
        const selectedDay = (new Date(currentDate)).toDateString()
        const taskScheduleDate = new Date(task.scheduledStart).toDateString()
        const isTaskScheduledForSelectedDay = (taskScheduleDate) === selectedDay
        const isTaskFinishedToday = (new Date(task.finish).toDateString() === selectedDay )
        const isTaskScheduledBeforeToday = new Date(taskScheduleDate).getTime() < new Date().getTime()
        var outputBool = false
        if (isTaskScheduledForSelectedDay) {outputBool = true}
        if (isTaskFinishedToday) { outputBool = true}
        if ( task.status !== "Completed" && isTaskScheduledBeforeToday ) {outputBool = true}
        return outputBool
    }

    //Allows kaban page to switch between entities (task, objective and project). Also updates kanban board upon updaete sto tasks, objectives and projects arrays. 
    useEffect( () => {
        switch (entityName) {
            case "task":
                setEntityArr( tasks.filter(tasksShownOnKanban) ) 
                break
            case "objective":
                setEntityArr(objectives)
                break
            case "project":
                setEntityArr(projects)
                break
            default:
                throw new Error("Invalid entity name. Must be one of 'task', 'objective', or 'project'.")
        } 
    }, [tasks, objectives, projects, entityName, currentDate])

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

    const handleDateFieldsAndStatus = (entity) => {
        //automatically adjusts the task fields when a task is dragged from one status column to another 
        if (entityName == "task") {
            let now = new Date( new Date().getTime() - new Date().getTimezoneOffset()*60*1000)
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
                handleEntitySubmit(null,  "create", "task", formatDateFields(task))
                //create completed task
                entity.start = !!entity.start? entity.start: now
                entity.finish = !!entity.finish? entity.finish : now
                const durationMS  = new Date(entity.finish).getTime() - new Date(entity.start).getTime() // in MS
                entity.duration  = Math.round(durationMS/(60*1000)) 
                entity.status = "Completed"
            }
        }
        return entity
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
            setEntityArr(newEntity) // put here to speed up DnD action (but can be removed)
            handleEntitySubmit(null, "update", entityName, updatedEntity)
        }
    }, [updatedEntity])

    const getInfoCardWidth = () => {
        return entityName==="task"? "926.6px": "695px"
    }

    const chooseTaskDuration = (task) => {
        return !!task.duration? task.duration : task.durationEst
    }

    const filterOutBreaks = (task) => {
        //filter out task that are breaks. 
        const breakObjective = objectives.find((objectives) => objectives.title==="Breaks")
        return task.objectiveId==breakObjective.id ? false: true
    }
    
    const calculateTaskTime = () => {
        if (entityName !== "task") return
        const relevantTasks = entityArr.filter(filterOutBreaks)
        const totalTime = relevantTasks.reduce((acc, task) => acc + chooseTaskDuration(task), 0)
        const remainingTime = relevantTasks.reduce((acc, task) => acc + (task.status !== "Completed" ? chooseTaskDuration(task) : 0), 0)
        setTotalTaskTime((totalTime/60).toFixed(1)) 
        if (remainingTime >= 60){
            setRemainingTaskTimeUnits("hrs")
            setRemainingTaskTime((remainingTime/60).toFixed(1))
        } else {
            setRemainingTaskTimeUnits("mins")
            setRemainingTaskTime(remainingTime)
        }
    }

    useEffect(()=> {calculateTaskTime()}, [entityArr])

    return (
        <div className="kanban-page">
            <HoverText width={getInfoCardWidth()}/>
            <div className="kanban-page-header"> 
                <Header/>
                <div className="kanban-page-header-2">
                    <button type="button" className="yesterday-btn" onClick={() => handleDayNavigation("previous-day")}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <div className="kanbnan-page-header-2-text">
                        <strong className="kanban-page-title" onClick={()=> setCurrentDate(new Date())} > {`Kanban (${entityName}s)`}</strong>
                        <Dropdown buttonContent={<i className="fa fa-chevron-down" aria-hidden="true"></i>} translate="0% 50%">
                            <div onClick={() => setEntityName("project")}> Projects </div>
                            <div onClick={() => setEntityName("objective")}> Objectives </div>
                            <div onClick={() => setEntityName("task")}> Tasks </div>
                        </Dropdown>
                        <strong> {remainingTaskTime} {remainingTaskTimeUnits} left (total {totalTaskTime} hrs) </strong>
                    </div>

                    <button type="button" className="tomorrow-btn" onClick={() => handleDayNavigation("next-day")} > <i className="fa fa-arrow-right" aria-hidden="true"> </i> </button>
                </div>
                <ToolBar> 
                    <AddEntity/>
                    <ViewPage/>
                    <RefreshEntities/>
                    <FilterPage/>
                </ToolBar>
            </div>
            <DndContext onDragEnd={handleDragEnd}>
                <div className="kanban-page-body">
                    {columns?.map((column) => 
                        <KanbanColumn key = {column.id} columnId={column.id} columnTitle={column.title} entityArr={entityArr} entityName={entityName}/>
                    )}
                </div>
            </DndContext>
        </div>
    )
}

export default Kanban