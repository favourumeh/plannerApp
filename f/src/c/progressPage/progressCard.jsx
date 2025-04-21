import "./progressCard.css"
import { useState, useContext, useRef, useEffect} from "react"
import globalContext from "../../context"
import {colourDict} from "../../staticVariables"

export default function ProgressCard ({entity, entityName, children}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [progressPercentage, setProgressPercentage] = useState(0)
    const {tasks, objectives, projects, 
        currentTask, currentObjective, currentProject,
        setCurrentTask, setCurrentObjective, setCurrentProject, 
        setForm, setIsModalOpen, setFormProject, setFormObjective} = useContext(globalContext)
    const divProgressOverlay = useRef(null)
    const divProgressCardTools = useRef(null)
    const [progressBarDivWidth, setProgressBarDivWidth] = useState(null)

    //Determines the width of the progress bar fill
    const getWidthOfProgressBarFill= () => {
        if (divProgressOverlay && divProgressCardTools){
            const overlayRect = divProgressOverlay.current.getBoundingClientRect()
            const toolRect = divProgressCardTools.current.getBoundingClientRect()
            const overlayWidth = overlayRect.width
            const toolWidth = toolRect.width
            setProgressBarDivWidth((overlayWidth-toolWidth)*progressPercentage/100)
        }
    }
    useEffect(() => {getWidthOfProgressBarFill()}, [progressBarDivWidth])

    //Determines whether an entity card can expand to reveal its children (e.g., Projects expands to reveal objectives) 
    const handleCardExpansion = (e) => {
        e.stopPropagation()
        entityName!=="task"? setIsExpanded(!isExpanded): undefined
    }

    //Determines what is shown in the entity card 
    const generateCardContent = () => {
        if (entityName==="project") {
            return entity.projectNumber + " " + entity.title
        } else if (entityName==="objective") {
            return entity.objectiveNumber + " " + entity.title
        } else {
            return entity.taskNumber + " " + entity.description
        }
    }
    //Determines the colour of the progress bar based on the progress percentage
    const generateProgressBarColour = () => {
        if (entityName!=="task"){
            if (progressPercentage<=30) {
                return colourDict["red"]
            } else if (progressPercentage<=60 )  {
                return colourDict["yellow"]
            } else if (progressPercentage<80){
                return colourDict["orange"]
            } else {
                return colourDict["green"]
            }
        }
    }

    //Determines the symbol and colour of a task based on its status
    const generateTaskStatusSymbol = () => {
        if (entityName==="task") {
            if (entity.status==="To-Do") {
                return <i style={{color:colourDict["red"]}} className="fa fa-times" aria-hidden="true"></i>
            } else if (entity.status==="In-Progress") {
                return <i style={{color:colourDict["orange"]}} className="fa fa-spinner" aria-hidden="true"></i>
            } else if (entity.status==="Paused") {
                return <i style={{color:colourDict["yellow"]}} className="fa fa-pause" aria-hidden="true"></i>
            } else if (entity.status==="Completed") {
                return <i style={{color:colourDict["green"]}} className="fa fa-check" aria-hidden="true"></i>
            } else {
                return
            }
        }

    }

    //Determine the progress percentage based on completed entities of the children
    const generateProgressPercentage = () => {
        if (entityName==="project") {
            const projectsObjectives = objectives.filter( (objective) => objective.projectId == entity.id )
            const objectiveIds = projectsObjectives.map( (objective) => objective.id)
            const projectsTasks = tasks.filter((task) => objectiveIds.includes(task.objectiveId)) 
            const noTasks = projectsTasks.length
            const noCompletedTasks = projectsTasks.reduce((acc, currTask) => currTask.status==="Completed"? acc+1:acc+0, 0)
            noTasks>0? setProgressPercentage(Math.round(100*noCompletedTasks/noTasks)): setProgressPercentage(0)
        } 
        if (entityName==="objective") {
            const objectivesTasks = tasks.filter((task) => task.objectiveId == entity.id)
            const noTasks = objectivesTasks.length
            const noCompletedTasks = objectivesTasks.reduce((acc, currTask) => currTask.status==="Completed"? acc+1:acc+0, 0)
            noTasks>0? setProgressPercentage(Math.round(100*noCompletedTasks/noTasks)): setProgressPercentage(0)
        }
    }

    useEffect(() => generateProgressPercentage(), [tasks, objectives, projects])

    //Open an edit entity form
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        entityName==="task"? setCurrentTask(entity) : entityName==="objective"? setCurrentObjective(entity) : setCurrentProject(entity)
        setIsModalOpen(true)
    }

    //flip dropdown icon from downwards-facing to upwards-facing
    const toggleDropdownIcon = () => {
        return isExpanded? <i className="fa fa-caret-up" aria-hidden="true"></i> : <i className="fa fa-caret-down" aria-hidden="true"></i>
    }

    //handle clicking add-entity button
    const handleClickAddBtn = (e) => {
        e.stopPropagation()

        if (entityName==="project") {
            setCurrentObjective({...currentObjective, "projectId":entity.id})
            setFormProject(projects.find((project) => entity.id===project.id))
            setForm(`create-objective`)
        } 

        if (entityName==="objective"){
            setCurrentTask({...currentTask, "objectiveId":entity.id})
            setFormProject(projects.find((project) => entity.projectId===project.id))
            setFormObjective(entity)
            setForm(`create-task`)
        }
        setIsModalOpen(true)
    }

    return (
        <div className={`progress-card-container  ${entityName}-card-container`}>
            <div className="progress-card-row">
                {entityName==="task"? undefined: <div className={`add-entity add-${entityName}-entity`}>
                    <button onClick={handleClickAddBtn}> <i className="fa fa-plus" aria-hidden="true"></i> </button>
                </div>}
                <div 
                    ref={divProgressOverlay} 
                    className={`progress-card-overlay ${entityName}-card-overlay`}
                    onClick={onClickEditBtn}
                >
                    <div className="progress-bar">
                        <div className="progress-bar-fill" 
                            style={{"width":entityName!=="task"? `${progressBarDivWidth}px`:"100%", 
                            "backgroundColor":generateProgressBarColour()}}
                        >
                        </div>

                        <div className="progress-card-content">{generateCardContent()}</div>
                    </div>

                    <div ref={divProgressCardTools} className="progress-card-tools" onClick={handleCardExpansion}>
                        {generateTaskStatusSymbol()}
                        {entityName !== "task"? <div className="progress-percentage"> {progressPercentage}%</div>: undefined}
                        {entityName !== "task"? <button className="dropdown-btn"> {toggleDropdownIcon()} </button>: undefined}
                    </div>

                </div>
            </div>

            {isExpanded? children : undefined}
        </div>

    )
}
