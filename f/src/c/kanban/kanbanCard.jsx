import { useDraggable } from "@dnd-kit/core"
import { useQuery, useMutation } from "@tanstack/react-query"
import globalContext from "../../context"
import "./kanbanCard.css"
import { useContext } from "react"
import { mutateEntityRequest } from "../../fetch_entities"
import { readTasksObjectiveAndProjectQueryOption } from "../../queryOptions"

export default function KanbanCard ({entity, entityName, refetchKanbanContent}) {
    const {setCurrentTask, setCurrentObjective, 
           setCurrentProject, setIsModalOpen, setForm, 
           currentDate, handleNotification, handleLogout} = useContext(globalContext)

    // get the project and objective numbers for each entity 
    const taskParentQuery = useQuery(readTasksObjectiveAndProjectQueryOption(entity.id, handleNotification, handleLogout))
    const projectNumber = taskParentQuery.isPending? "*" : taskParentQuery.data.project.projectNumber
    const objectiveNumber = taskParentQuery.isPending? "*" : taskParentQuery.data.objective.objectiveNumber

    const deleteEntityMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: refetchKanbanContent,
    })

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
        deleteEntityMutation.mutate({
            action: "delete",
            entityName: entityName,
            currentEntity: entity, 
            handleNotification: handleNotification, 
            handleLogout: handleLogout,
        })
    }

    // DnD - Make enitity cards draggable
    const { attributes, listeners, setNodeRef, transform } = useDraggable({id: entity.id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of entity card
    
    // Signal Parent task (P) (i.e., a task is not derived from another task )
    const signalParentTask = () => !!entity.parentTaskId?  "" : "(P)"

    //indicate outstanding task
    const selectedDate = new Date(new Date(currentDate).toDateString())
    const taskFinishDt = new Date(new Date(entity.finish).toDateString())
    const taskScheduledDt = new Date(new Date(entity.scheduledStart).toDateString())
    const taskFinishedAfterScheduledDate = (taskFinishDt > taskScheduledDt)
    const taskScheduledOnOrBeforeSelectedDate = (taskScheduledDt <= selectedDate)
    const taskNotCompleted =  entity.status !== "Completed"
    const taskIsScheduledForToday = new Date(entity.scheduledStart).toDateString() === new Date().toDateString()
    const kanbanContentStyle = {"color": entityName!="task" ? "white":  taskIsScheduledForToday ? "white" : taskFinishedAfterScheduledDate || (taskScheduledOnOrBeforeSelectedDate &&  taskNotCompleted) ? "red": "white"}
    return (
        <div 
            style ={style}
            ref={setNodeRef} 
            {...listeners}
            {...attributes} 
            className="kanban-card-overlay"
        >
            <button onPointerDown={onClickEditBtn} > <i className="fa fa-pencil" aria-hidden="true"></i></button>
            <div style={kanbanContentStyle} className="kanban-card-content">
                {generateEntityNumbers(entityName)} {entityName==="task"? signalParentTask() + " " + entity.description: entity.title}
            </div>
            <button onPointerDown ={onClickDeleteBtn}> &times;</button>

        </div>
    )

}