import { useDraggable } from "@dnd-kit/core"
import globalContext from "../context"
import "./kanbanCard.css"
import { useState, useEffect, useContext } from "react"

export default function KanbanCard ({entity, entityName}) {
    const {tasks, objectives, projects, setCurrentTask, setCurrentObjective, setCurrentProject, setIsModalOpen, setForm, handleDeleteEntity} = useContext(globalContext)
    const [projectNumber, setProjectNumber] = useState()
    const [objectiveNumber, setObjectiveNumber] = useState()

    const handleEntityNumbers = () => {
        if (entityName == "task") {
            setObjectiveNumber(objectives.filter((objective) => objective["id"] == entity["objectiveId"])[0]["objectiveNumber"])
            const projectId = objectives.filter((objective) => objective["id"] == entity["objectiveId"])[0]["projectId"]
            setProjectNumber(projects.filter((project)=> project["id"]==projectId)[0]["projectNumber"])
        }
        if (entityName== "objective") {
            setProjectNumber(projects.filter((project)=> project["id"]==entity.projectId)[0]["projectNumber"])
        } 
    }

    useEffect(()=>{ //stops the project or objective numbers from being undefined 
        if (["task", "objective"].includes(entityName)){
            projectNumber? null:handleEntityNumbers()
        }
        if (entityName == "task") {
            objectiveNumber? null:handleEntityNumbers()
        }
    }, [projectNumber, objectiveNumber])

    const generateEntityId = (entityName) => {
        switch (entityName) {
            case "task":
                return `${projectNumber}.${objectiveNumber}.${entity.taskNumber}`
            case "objective":
                return `${projectNumber}.${entity.objectiveNumber}`
            case "project":
                return `${entity.projectNumber}`
            default:
                throw new Error("Invalid entity name. Must be one of 'task', 'objective', or 'project'.")
        } 
    }

    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        entityName==="task"? setCurrentTask(entity) : entityName==="objective"? setCurrentObjective(entity) : setCurrentProject(entity)
        setIsModalOpen(true)
    }

    const onClickDeleteBtn = (e) => {
        e.stopPropagation()
        handleDeleteEntity(e, entityName, entity.id)
    }
    const { attributes, listeners, setNodeRef, transform } = useDraggable({id: entity.id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of entity card
  
    return (
        <div 
            style ={style}
            ref={setNodeRef} 
            {...listeners}
            {...attributes} 
            className="kanban-card-overlay"
        >
            <button onPointerDown={onClickEditBtn} > <i className="fa fa-pencil" aria-hidden="true"></i></button>
            <div className="kanban-card-content">
                {generateEntityId(entityName)} {entity.description}
            </div>
            <button onPointerDown ={onClickDeleteBtn}> &times;</button>

        </div>
    )

}