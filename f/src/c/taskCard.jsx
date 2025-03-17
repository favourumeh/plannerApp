import "./taskCard.css"
import { useState, useEffect, useContext} from "react"
import globalContext from "../context"

function TaskCard ({task, handleDeleteTask}) {
    const {objectives, projects} = useContext(globalContext)
    const [projectNumber, setProjectNumber] = useState()
    const [objectiveNumber, setObjectiveNumber] = useState()

    const handleEntityNumbers = () => {
        setObjectiveNumber(objectives.filter((objective) => objective["id"] == task["objectiveId"])[0]["objectiveNumber"])
        const projectId = objectives.filter((objective) => objective["id"] == task["objectiveId"])[0]["projectId"]
        setProjectNumber(projects.filter((project)=> project["id"]==projectId)[0]["projectNumber"])
    }
    useEffect(()=>handleEntityNumbers, [])
    return (
        <div className="task-card">
            <div className="task-content"><span className="task-identifier"> Task {projectNumber}.{objectiveNumber}.{task.taskNumber} </span> {task.description}</div>
            <button className="task-delete-btn" onClick={(e) => handleDeleteTask(e, task.id)}>&times;</button>
        </div>
    )
}
export default TaskCard
