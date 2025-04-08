import "./taskCard.css"
import { useState, useEffect, useContext} from "react"
import globalContext from "../context"

function TaskCard ({task}) {
    const {setForm, setIsModalOpen, objectives, projects, setCurrentTask, handleDeleteEntity, handleEntitySubmit, formatDateFields } = useContext(globalContext)
    const [projectNumber, setProjectNumber] = useState()
    const [objectiveNumber, setObjectiveNumber] = useState()

    const handleEntityNumbers = () => {
        setObjectiveNumber(objectives.filter((objective) => objective["id"] == task["objectiveId"])[0]["objectiveNumber"])
        const projectId = objectives.filter((objective) => objective["id"] == task["objectiveId"])[0]["projectId"]
        setProjectNumber(projects.filter((project)=> project["id"]==projectId)[0]["projectNumber"])
    }

    const handleEditTask = (e) => {
        e.stopPropagation()
        setForm("update-task")
        setCurrentTask(task)
        setIsModalOpen(true)
    }
    const handleCompleteTask = (e, task) => {
        e.stopPropagation()
        let  completedTask = {...task, status:"Completed"}
        console.log("completedTask", completedTask)
        completedTask = formatDateFields(completedTask)
        handleEntitySubmit(e, "update", "task", completedTask)
    }

    useEffect(()=>handleEntityNumbers, [task])
    useEffect(()=>{
        if (!projectNumber || !objectiveNumber) {
            handleEntityNumbers()
            }
        }, [projectNumber, objectiveNumber])
    const cardHeight  = String(15*task.duration/10) + "px"
    const taskIdentifierStyle = {"color": task.status === "Completed"? "rgb(0, 230, 0)": "white"}
    return (
        <div id={`row-id-${task.id}`} className="task-row">
            <button> 
                <i id={`add-task-id-${task.id}`}  className="fa fa-plus" aria-hidden="true"/>
            </button>
            <button onClick={(e) => handleCompleteTask(e, task)}> 
                <i class="fa fa-check" aria-hidden="true"></i>
            </button>
            <div id={`task-card-id-${task.id}`} style = {{"height":cardHeight}} className="task-card">
                <div id={`task-content-id-${task.id}`}className="task-content" onClick={(e) => handleEditTask(e)}>
                    <div 
                        id={`task-identifier-id-${task.id}`} 
                        style={taskIdentifierStyle}
                        className="task-identifier"
                    >   Task {projectNumber}.{objectiveNumber}.{task.taskNumber}
                    </div> 
                    <div className ="task-content-divider"></div>
                    <div class="task-description"> {task.description} </div>
                </div>
            </div>
            <button onClick={(e) => handleDeleteEntity(e, "task", task.id)}> 
                <i id={`add-task-id-${task.id}`}  className="fa fa-times" aria-hidden="true"/>
            </button>
        </div>

    )
}
export default TaskCard
