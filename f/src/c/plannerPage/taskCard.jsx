
import { useMutation } from "@tanstack/react-query"
import "./taskCard.css"
import { mutateEntityRequest } from "../../fetch_entities"
import { useContext } from "react"
import globalContext from "../../context"
import TaskInfoCard from "../InfoCards/taskInfoCard"
import { useDraggable } from "@dnd-kit/core"
import { isDateOlder } from "../../utils/dateUtilis"

export function TaskCard({task, projects, objectives, refetchPlannerTasks, translate}) {
    const {setForm, setCurrentTask, handleNotification, handleLogout, setIsModalOpen} = useContext(globalContext)
    const objective = objectives?.find(objective=> task.objectiveId===objective.id)
    const project = projects.find((project) => objective?.projectId===project.id)

    const deleteEntityMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: refetchPlannerTasks,
    })
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-task`)
        setCurrentTask(task)
        setIsModalOpen(true)
    }

    const onClickDeleteBtn = (e) => {
        if (e.ctrlKey) {
            e.stopPropagation()
            deleteEntityMutation.mutate({
                action: "delete",
                entityName: "task",
                currentEntity: task, 
                handleNotification: handleNotification, 
                handleLogout: handleLogout,
            })
        } else {
            handleNotification(`Hold down ctrl key to delete task`, "error")
        }
    }

    // DnD - Make enitity cards draggable
    const { attributes, listeners, setNodeRef, transform } = useDraggable({id: task.id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of task card

    //generate the style of the task card
    const generateTaskCardFontColour = () => {//generate colour of the taskCard text
        let colour = "white"
        if ( task.status === "Completed" ) {colour = "rgba(0,230,0)"}
        if ( task.status === "Paused") {colour = "orange"}
        if ( task.status === "In-Progress" ) { colour = "yellow"}
        if ( task.status !== "Completed" && isDateOlder( (new Date(task.start || task.scheduledStart)), new Date() ) ) {colour = "red"}
        if ( !task.scheduledStart) { colour="white"}
        return colour
    }
    const pauseSignal = () => {
        return (
        task.status === "Paused"? <i className="fa fa-pause" aria-hidden="true"></i>: ""
        )
    }

    const stylePlannerTaskContent = {color:generateTaskCardFontColour()}

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
                    style={stylePlannerTaskContent}  
                    className="planner-task-card-content"> {pauseSignal()} {project?.projectNumber}.{objective?.objectiveNumber}.{task.taskNumber}: {task?.description}
                </div>
                <TaskInfoCard task={task} taskObjective={objective} taskProject={project} translate={translate}/>

                <button onPointerDown ={onClickDeleteBtn}> 
                    <i className="fa fa-times" aria-hidden="true"></i>
                </button>
            </div>
    )

}