
import { useMutation } from "@tanstack/react-query"
import "./taskCard.css"
import { mutateEntityRequest } from "../../fetch_entities"
import { useContext, useEffect, useState } from "react"
import globalContext from "../../context"
import TaskInfoCard from "../InfoCards/taskInfoCard"
import { isDateOlder } from "../../utils/dateUtilis"
import localPlannerPageContext from "./localPlannerPageContext"

export function TaskCard({task, projects, objectives, refetchPlannerTasks, isDateCardSelected, translate}) {
    const { bulkMode, setIdsOfTasksToUpdate } = useContext(localPlannerPageContext)
    const { setForm, setCurrentTask, handleNotification, handleLogout, setIsModalOpen } = useContext(globalContext)
    const [ isTaskSelected, setIsTaskSelected ] = useState(isDateCardSelected)

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

    //generate the style of the task card
    const generateTaskCardFontColour = () => {//generate colour of the taskCard text
        let colour = "white"
        if ( task.status === "Completed" ) {colour = "rgba(0,230,0)"}
        if ( task.status === "Paused") {colour = "orange"}
        if ( task.status === "In-Progress" ) { colour = "yellow"}
        if ( task.status !== "Completed" && isDateOlder( (new Date(task.start || task.scheduledStart)), new Date() ) ) {colour = "red"} // help highlight tasks in the past
        if ( !task.scheduledStart) { colour="white"} // colour tasks in the unscheduled section white
        if ( isTaskSelected ) { colour="yellow" } //helps highlight tasks selected for bulk movement  
        if ( !!task.preview ) {colour ="yellow" } //helps highligh the preview of the bulk movement of tasks
        return colour
    }

    const configureOpacity = () => {
        let opacity = 1
        if (bulkMode){
            if ( !!task.preview){
                opacity = 1
            } else {
                opacity = 0.5
            }
        }
        return opacity
    }
    const pauseSignal = task.status === "Paused"? <i className="fa fa-pause" aria-hidden="true"></i>: ""

    const stylePlannerTaskContent = {color:generateTaskCardFontColour(), opacity:configureOpacity()}
    const indicateChildTask = !!task.parentTaskId? "[C]":""

    const handleSelectTask = (e) => {
        e.stopPropagation()
        const isTaskSelected_ = !isTaskSelected
        if (isTaskSelected_){
            setIdsOfTasksToUpdate(prev => [...prev, task.id])
        } else {
            setIdsOfTasksToUpdate(prev => prev.filter(taskId => task.id != taskId ))
        }
        setIsTaskSelected(!isTaskSelected)

    }

    useEffect(() => { // when in bulk mode, ticking the date card should tick all the tasks in the date card and vice versa
        if (bulkMode){
            if (isTaskSelected && !isDateCardSelected) {
                setIsTaskSelected(false)
            }
            if (!isTaskSelected && isDateCardSelected) {
                setIsTaskSelected(true)
            }
        }
    }, [isDateCardSelected])
    
    useEffect(()=> { // unticks task when bulk mode is exited
        if (!bulkMode) {
            setIsTaskSelected(false)
        }
    }, [bulkMode])

    return (
        <div className="planner-task-card-container">
            <div className="planner-task-title-row">
                {bulkMode? 
                    (isTaskSelected?
                        <button className="planner-task-select" onPointerDown={handleSelectTask} > 
                            <i className="fa fa-check-square-o" aria-hidden="true" />
                        </button> :
                        <button className="planner-task-select" onPointerDown={handleSelectTask} >
                            <i className="fa fa-square-o side-btn" aria-hidden="true" />
                        </button>
                    ) :
                    <button onPointerDown={onClickEditBtn} > 
                        <i className="fa fa-pencil" aria-hidden="true" onPointerDown={onClickEditBtn}/>
                    </button>
                }
                <div 
                    style={stylePlannerTaskContent}  
                    className="planner-task-card-content"> {pauseSignal} {project?.projectNumber}.{objective?.objectiveNumber}.{task.taskNumber}: {indicateChildTask} {task?.description}
                </div>

                <button onPointerDown ={onClickDeleteBtn}> 
                    <i className="fa fa-times" aria-hidden="true"></i>
                </button>
            </div>
            <TaskInfoCard task={task} taskObjective={objective} taskProject={project} translate={translate}/>
        </div>
    )
}