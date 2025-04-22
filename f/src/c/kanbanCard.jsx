import { useDraggable } from "@dnd-kit/core"
import globalContext from "../context"
import "./kanbanCard.css"
import { useState, useEffect, useContext } from "react"

export default function KanbanCard ({entity, entityName}) {
    const {objectives, projects, setCurrentTask, setCurrentObjective, 
           setCurrentProject, setIsModalOpen, setForm, handleDeleteEntity,
            getProject, getObjective} = useContext(globalContext)
    const [projectNumber, setProjectNumber] = useState()
    const [objectiveNumber, setObjectiveNumber] = useState()

    // calculate the project and objective numbers for each entity 
    const handleEntityNumbers = () => {
        setProjectNumber(getProject(entity, entityName, projects, objectives)?.projectNumber)
        setObjectiveNumber(getObjective(entity, entityName, objectives)?.objectiveNumber)
    }

    useEffect(()=>handleEntityNumbers(), [entity]) // very important

    const generateEntityNumbers = () => {
        if (entityName==="task") {
            return `${projectNumber}.${objectiveNumber}.${entity.taskNumber}`
        } else if (entityName==="objective") {
            return `${projectNumber}.${entity.objectiveNumber}`
        } else {
            return `${entity.projectNumber}`
        }
    }

    // Edit and Delete buttons adjacent to entity cards
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

    // DnD - Make enitity cards draggable
    const { attributes, listeners, setNodeRef, transform } = useDraggable({id: entity.id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of entity card
    
    // Signal Parent task (P) (i.e., a task is not derived from another task )
    const signalParentTask = () => !!entity.parentTaskId?  "" : "(P)"
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
                {generateEntityNumbers(entityName)} {entityName==="task"? signalParentTask() + " " + entity.description: entity.title}
            </div>
            <button onPointerDown ={onClickDeleteBtn}> &times;</button>

        </div>
    )

}