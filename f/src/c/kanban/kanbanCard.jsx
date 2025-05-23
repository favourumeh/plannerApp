import { useDraggable } from "@dnd-kit/core"
import { useQuery, useMutation } from "@tanstack/react-query"
import globalContext from "../../context"
import "./kanbanCard.css"
import { useContext } from "react"
import { mutateEntityRequest } from "../../fetch_entities"
import { readTasksObjectiveAndProjectQueryOption } from "../../queryOptions"

export default function KanbanCard ({task, entityName, refetchKanbanContent}) {
    const {setCurrentTask, setIsModalOpen, setForm, 
           currentDate, handleNotification, handleLogout} = useContext(globalContext)

    // get the project and objective numbers for each task 
    const taskParentQuery = useQuery(readTasksObjectiveAndProjectQueryOption(task.id, handleNotification, handleLogout))
    const projectNumber = taskParentQuery.isPending? "*" : taskParentQuery.data.project.projectNumber
    const objectiveNumber = taskParentQuery.isPending? "*" : taskParentQuery.data.objective.objectiveNumber

    const deleteEntityMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: refetchKanbanContent,
    })

    const generateEntityNumbers = () => `${projectNumber}.${objectiveNumber}.${task.taskNumber}`

    // Edit and Delete buttons adjacent to task cards
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        setCurrentTask(task)
        setIsModalOpen(true)
    }
    const onClickDeleteBtn = (e) => {
        e.stopPropagation()
        deleteEntityMutation.mutate({
            action: "delete",
            entityName: entityName,
            currentEntity: task, 
            handleNotification: handleNotification, 
            handleLogout: handleLogout,
        })
    }

    // DnD - Make enitity cards draggable
    const { attributes, listeners, setNodeRef, transform } = useDraggable({id: task.id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of task card
    
    // Signal Parent task (P) (i.e., a task is not derived from another task )
    const signalParentTask = () => !!task.parentTaskId?  "" : "(P)"

    //indicate outstanding task
    const selectedDate = new Date(new Date(currentDate).toDateString())
    const isFinsishFieldEmpty = !!task.finish
    const taskFinishDt = new Date(new Date(task.finish).toDateString())
    const taskScheduledDt = new Date(new Date(task.scheduledStart).toDateString())
    const taskFinishedAfterScheduledDate = (taskFinishDt > taskScheduledDt)
    const taskScheduledOnOrBeforeSelectedDate = (taskScheduledDt <= selectedDate)
    const taskNotCompleted =  task.status !== "Completed"
    const taskIsScheduledForTodayOrFutureDate = taskScheduledDt.getTime() >= new Date(new Date().toDateString()).getTime()

    const getKanbanCardColour =() => {
        if (taskIsScheduledForTodayOrFutureDate) return "white"
        if (taskFinishedAfterScheduledDate) return "red"
        if (!isFinsishFieldEmpty) {
            if (taskScheduledOnOrBeforeSelectedDate &&  taskNotCompleted) return "red"
        }
        return "white"
    }   
    const kanbanContentStyle = {"color": getKanbanCardColour()}

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
                {generateEntityNumbers(entityName)} {signalParentTask() + " " + task.description}
            </div>
            <button onPointerDown ={onClickDeleteBtn}> &times;</button>
        </div>
    )

}