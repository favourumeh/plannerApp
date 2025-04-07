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

const Kanban = ({sitePage}) => {
    if (sitePage!=="view-kanban") {
        return 
    }
    const {tasks, objectives, projects, handleEntitySubmit, handleRefresh} = useContext(globalContext)
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
    useEffect( () => {
        switch (entityName) {
            case "task":
                setEntityArr(tasks)
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

        if (!over) {
            return}

        const entityId = active.id
        const newStatus = over.id 
        
        const updatedEntity_ = entityArr.find((entity) => entity.id ===  entityId)
        setSourceColumn(updatedEntity_.status)
        setDestColumn(newStatus)
        setUpdatedEntityIdAndStatus({id:updatedEntity_.id, status:newStatus})
    }

    const formatDateFields = (entity, dateFields) => {
        return Object.entries(entity).reduce((acc, [key, value]) => {
            if (dateFields.includes(key)) {
                const formatedDateTime = new Date(value).toISOString().replace(/:\d{2}\.\d{3}Z$/, '')
                acc[key] = formatedDateTime
            } else{
                acc[key] = entity[key]
            } 
            return acc
        }, {})
    }

    useEffect(() => {
        if (updatedEntityIdAndStatus.id) {
            let updatedEntity_ = entityArr.find((entity) => entity.id ===  updatedEntityIdAndStatus.id)
            console.log("updatedEntity_:", updatedEntity_)
            updatedEntity_ = {...updatedEntity_, "status":updatedEntityIdAndStatus.status}
            const dateFields = ["scheduledStart", "scheduledFinish", "start", "finish", "deadline"]
            updatedEntity_ = formatDateFields(updatedEntity_, dateFields)
            setUpdatedEntity(updatedEntity_)
        }
    }, [updatedEntityIdAndStatus])

    useEffect(() => {
        if (updatedEntityIdAndStatus.id && sourceColumn !== destColumn) {
            setUpdatedEntityIdAndStatus({})
            handleEntitySubmit(null, "update", entityName, updatedEntity)
            handleRefresh()
        }
    }, [updatedEntity])

    return (
        <div className="kanban-page">
            <div className="kanban-page-header"> 
                <Header/>
                <div className="kanban-page-header-2">
                    <strong> {`Kanban (${entityName}s)`}</strong>
                    <Dropdown buttonContent={<i class="fa fa-chevron-down" aria-hidden="true"></i>} translate="0% 50%">
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
                        <KanbanColumn columnId={column.id} columnTitle={column.title} entityArr={entityArr} entityName={entityName}/>
                    )}
                </div>
            </DndContext>
        </div>
    )
}

export default Kanban