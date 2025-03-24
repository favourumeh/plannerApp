import "./taskCard.css"
import { useState, useEffect, useContext} from "react"
import globalContext from "../context"

function TaskCard ({task, handleDeleteEntity}) {
    const {setForm, setIsModalOpen, objectives, projects, setCurrentTask} = useContext(globalContext)
    const [projectNumber, setProjectNumber] = useState()
    const [objectiveNumber, setObjectiveNumber] = useState()

    const handleEntityNumbers = () => {
        setObjectiveNumber(objectives.filter((objective) => objective["id"] == task["objectiveId"])[0]["objectiveNumber"])
        const projectId = objectives.filter((objective) => objective["id"] == task["objectiveId"])[0]["projectId"]
        setProjectNumber(projects.filter((project)=> project["id"]==projectId)[0]["projectNumber"])
    }

    const handleEditTask = (e) => {
        e.stopPropagation()
        setForm("edit-task")
        setCurrentTask(task)
        setIsModalOpen(true)
    }

    useEffect(()=>handleEntityNumbers, [])
    return (
        <div id={`row-id-${task.id}`} className="task-row">
            <i id={`add-task-id-${task.id}`}  className="fa fa-plus" aria-hidden="true"></i>
            <div id={`task-card-id-${task.id}`} className="task-card">
                <div id={`task-content-id-${task.id}`}className="task-content" onClick={(e) => handleEditTask(e)}>
                    <span id={`task-identifier-id-${task.id}`} className="task-identifier"> Task {projectNumber}.{objectiveNumber}.{task.taskNumber} </span> 
                    {task.description}
                </div>
                <button id={`delete-task-id-${task.id}`} className="task-delete-btn" onClick={(e) => handleDeleteEntity(e, "task", task.id)}>&times;</button>
            </div>
        </div>

    )
}
export default TaskCard
