
import { useMutation } from "@tanstack/react-query"
import "./taskCard.css"
import { mutateEntityRequest } from "../../fetch_entities"
import { useContext } from "react"
import globalContext from "../../context"
import TaskInfoCard from "../InfoCards/taskInfoCard"
import { useDraggable } from "@dnd-kit/core"

export function TaskCard({task, projects, objectives, refetchScheduledTasks, translate}) {
    const {setForm, setCurrentTask, handleNotification, handleLogout, setIsModalOpen} = useContext(globalContext)
    const objective = objectives?.find(objective=> task.objectiveId===objective.id)
    const project = projects.find((project) => objective?.projectId===project.id)

    const deleteEntityMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: refetchScheduledTasks,
    })
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-task`)
        setCurrentTask(task)
        setIsModalOpen(true)
    }

    const onClickDeleteBtn = (e) => {
        e.stopPropagation()
        deleteEntityMutation.mutate({
            action: "delete",
            entityName: "task",
            currentEntity: task, 
            handleNotification: handleNotification, 
            handleLogout: handleLogout,
        })
    }

    // DnD - Make enitity cards draggable
    const { attributes, listeners, setNodeRef, transform } = useDraggable({id: task.id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of task card
    return (
            <div 
                style ={style}
                ref={setNodeRef} 
                {...listeners}
                {...attributes} 
                className="planner-task-card-overlay"
            >
                <button onPointerDown={onClickEditBtn} > 
                    <i className="fa fa-pencil" aria-hidden="true"></i>
                </button>

                <div 
                    style={{"color":task.status==="Completed"? "rgba(0,230,0)": "white"}}  
                    className="planner-task-card-content"> {project?.projectNumber}.{objective?.objectiveNumber}.{task.taskNumber}: {task?.description}
                </div>
                <TaskInfoCard task={task} taskObjective={objective} taskProject={project} translate={translate}/>

                <button onPointerDown ={onClickDeleteBtn}> 
                    <i className="fa fa-times" aria-hidden="true"></i>
                </button>
            </div>
    )

}