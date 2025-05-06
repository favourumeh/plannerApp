import "./taskCard.css"
import {useContext} from "react"
import globalContext from "../../context"
import TaskInfoCard from "../InfoCards/taskInfoCard"

const findTaskObjective = (objectives, task) => objectives.find((objective)=> objective.id===task.objectiveId )
const findObjectiveProject = (projects, objective) => projects.find((project)=> project.id===objective.projectId)

function TaskCard ({task}) {
    const {setForm, setIsModalOpen, objectives, projects, setCurrentTask, handleDeleteEntity, userSettings } = useContext(globalContext)
    const taskObjective  = findTaskObjective(objectives, task)
    const taskProject = findObjectiveProject(projects, taskObjective)
    const projectNumber  = taskProject.projectNumber
    const objectiveNumber  = taskObjective.objectiveNumber

    const handleEditTask = (e) => {
        e.stopPropagation()
        setForm("update-task")
        setCurrentTask(task)
        setIsModalOpen(true)
    }

    const calculateTaskDuration = () => {
        let duration_est = task.durationEst
        if (!!task.start && !!task.finish ) {
            const durationMS  = new Date (task.finish).getTime() - new Date(task.start).getTime() // in MS
            duration_est  = Math.round(durationMS/(60*1000)) // in Mins
        }
        return duration_est
    }
    const taskDuration = calculateTaskDuration()
    const cardHeight  = String(15*taskDuration/10) + "px"
    const taskIdentifierStyle = {"color": task.status === "Completed"? "rgb(0, 230, 0)": "white"}

    //calculate the position of the task row card relative to the top of the homepage body 
    const taskPosition = () => {
        const dayStartMs = new Date(task.start).setHours(userSettings.dayStartTime.split(":")[0], userSettings.dayStartTime.split(":")[1], 0, 0)
        const taskStartMs = new Date(task.start).getTime()
        const deltaMinutes = (taskStartMs - dayStartMs)/(1000*60) + new Date().getTimezoneOffset()
        // console.log(`deltaMinutes (${projectNumber}.${objectiveNumber}.${task.taskNumber})`, task.scheduledStart, deltaMinutes)
        // console.log(deltaMinutes*15/10)
        return String(deltaMinutes*15/10) // convert minutes to px
    }
    const taskRowCardStyle = { "position": "absolute", "top":taskPosition()+ "px"}

    //generate the text on the task card
    const generateTaskCardText = () => {
        if (taskDuration<10) return ""
        return `Task ${projectNumber}.${objectiveNumber}.${task.taskNumber} ${task.description}`
    }
    return (
        <div  style={taskRowCardStyle} id={`row-id-${task.id}`} className="task-row">
            <TaskInfoCard task={task} translate ={"122% 0%"} taskObjective={taskObjective} taskProject={taskProject}/>
            <button> 
                <i id={`add-task-id-${task.id}`}  className="fa fa-plus" aria-hidden="true"/>
            </button>
            <div id={`task-card-id-${task.id}`} style = {{"height":cardHeight}} className="task-card">
                <div id={`task-content-id-${task.id}`}className="task-content" onClick={(e) => handleEditTask(e)}>

                    <div style={taskIdentifierStyle} className="task-description"> {generateTaskCardText()} </div>
                </div>
            </div>
            <button onClick={(e) => handleDeleteEntity(e, "task", task.id)}> 
                <i id={`add-task-id-${task.id}`}  className="fa fa-times" aria-hidden="true"/>
            </button>
        </div>        
    )
}
export default TaskCard
