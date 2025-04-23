import globalContext from "../context"
import "./kanban.css"
import { useContext, useState, useEffect } from "react"
import Header from "./header"
import ToolBar from "./toolbar"
import KanbanColumn from "./kanbanColumn"
import {DndContext} from "@dnd-kit/core"
import Dropdown from "./Dropdown"
import AddEntity from "./toolbarContent/addEntity"
import FilterPage from "./toolbarContent/filterPage" 
import ViewPage from "./toolbarContent/viewPage"
import RefreshEntities from "./toolbarContent/refreshEntities"
import HoverText from "./hoverText"

const Kanban = ({sitePage}) => {
    if (sitePage!=="view-kanban") return 
    const {tasks, setTasks, objectives, projects, handleEntitySubmit, handleRefresh, formatDateFields} = useContext(globalContext)
    const [entityName, setEntityName] = useState("task")
    const [entityArr, setEntityArr] = useState([])
    const [updatedEntity, setUpdatedEntity] = useState([])
    const [updatedEntityIdAndStatus, setUpdatedEntityIdAndStatus] = useState({})
    const [sourceColumn, setSourceColumn] = useState("")
    const [destColumn, setDestColumn] = useState("")

    const [columns, setColumns] = useState([
        {id:"To-Do", title:"To Do"}, 
        {id:"In-Progress", title:"In Progress"}, 
        {id:"Paused", title:"Paused"}, 
        {id:"Completed", title:"Completed"}
    ])

    const tasksShownOnKanban = (task) => {
        const todaysDate = (new Date()).toDateString()
        const taskScheduleDate = new Date(task.scheduledStart).toDateString()
        const isTaskScheduledForToday = (taskScheduleDate) === todaysDate
        const isTaskFinishedToday = (new Date(task.finish).toDateString() === todaysDate )
        const isTaskScheduledBeforeToday = new Date(taskScheduleDate).getTime() < new Date(todaysDate).getTime()
        var outputBool = false
        if (isTaskScheduledForToday) {outputBool = true}
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
    }, [tasks, objectives, projects, entityName])

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
        if (entityName == "task") {
            let now = new Date( new Date().getTime() - new Date().getTimezoneOffset()*60*1000)
            if (entity.status==="To-Do") {
                entity.start = null
                entity.finish = null
            }
            if (entity.status==="In-Progress") {
                entity.start = !entity.start? now : entity.start
                entity.finish = null
            }
            if (entity.status==="Completed") {
                entity.start = !!entity.start? entity.start: now
                entity.finish = now
                const durationMS  = new Date (entity.finish).getTime() - new Date(entity.start).getTime() // in MS
                entity.duration  = Math.round(durationMS/(60*1000)) // in Mins
            }
            if (entity.status==="Paused") {
                entity.wasPaused = true
                const getParentTaskId = () => !!entity.parentTaskId?  entity.parentTaskId : entity.id
                let task = {...entity, "parentTaskId":getParentTaskId(), "start":null}
                handleEntitySubmit(null,  "create", "task", formatDateFields(task))
                const durationMS  = new Date (entity.finish).getTime() - new Date(entity.start).getTime() // in MS
                entity.duration  = Math.round(durationMS/(60*1000)) 
                entity.status = "Completed"
                const start = new Date(now.getTime() - entity.durationEst*60*1000)
                entity.start = !!entity.start? entity.start: start
                entity.finish = now
            }
        }
        return entity
    }

    useEffect(() => {
        if (!!updatedEntityIdAndStatus.id && sourceColumn !== destColumn) {
            let updatedEntity_ = entityArr.find((entity) => entity.id ===  updatedEntityIdAndStatus.id)
            console.log("updatedEntity_:", updatedEntity_)
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

    const getHoverWidth = () => {
        return entityName==="task"? "926.6px": "695px"
    }
    return (
        <div className="kanban-page">
            <HoverText width={getHoverWidth()}/>
            <div className="kanban-page-header"> 
                <Header/>
                <div className="kanban-page-header-2">
                    <strong> {`Kanban (${entityName}s)`}</strong>
                    <Dropdown buttonContent={<i className="fa fa-chevron-down" aria-hidden="true"></i>} translate="0% 50%">
                        <div onClick={() => setEntityName("project")}> Projects </div>
                        <div onClick={() => setEntityName("objective")}> Objectives </div>
                        <div onClick={() => setEntityName("task")}> Tasks </div>
                    </Dropdown>
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