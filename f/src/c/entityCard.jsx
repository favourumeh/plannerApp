import "./entityCard.css"
import { useContext} from "react"
import globalContext from "../context"

const findTaskObjective = (objectives, task) => objectives.find((objective)=> objective.id===task.objectiveId )
const findObjectiveProject = (projects, objective) => projects.find((project)=> project.id===objective.projectId)

function EntityCard ({entity, entityName}) {
    const {setForm, setIsModalOpen, objectives, projects, setCurrentTask, setCurrentProject, setCurrentObjective, handleDeleteEntity} = useContext(globalContext)

    const getProject = (entity) => {
        if (entityName === "task") {
            return findObjectiveProject(projects, findTaskObjective(objectives, entity))
        } else if (entityName === "objective") {
            return findObjectiveProject(projects, entity)
        } else {
            return entity
        }
    }
    
    const getObjective = (entity) => {
        if (entityName === "task") {
            return findTaskObjective(objectives, entity)
        } else if (entityName === "objective") {
            return entity
        } else {
            return null
        }
    }

    const project = getProject(entity)
    const objective  = getObjective(entity)

    const handleEditEntity = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        entityName==="task"? setCurrentTask(entity): entityName==="objective"? setCurrentObjective(entity): setCurrentProject(entity)
        setIsModalOpen(true)
    }

    const generateCardContent = () => {
        if (entityName==="task") {
            return `Task ${project.projectNumber}.${objective.objectiveNumber}.${entity.taskNumber}`
        } else if (entityName==="objective") {
            return `Objective ${project.projectNumber}.${entity.objectiveNumber}`
        } else {
            return `Project ${entity.projectNumber}`
        }
    }

    return (
        <div id={`row-id-${entity.id}`} className="entity-row">
            <div id={`entity-card-id-${entity.id}`} className="entity-card">
                <div id={`entity-content-id-${entity.id}`}className="entity-content" onClick={(e) => handleEditEntity(e)}>
                    <span id={`entity-identifier-id-${entity.id}`} className="entity-identifier"> {generateCardContent()} </span> 
                    {["project", "objective"].includes(entityName)? entity.title:entity.description}
                </div>
                <button id={`delete-entity-id-${entity.id}`} className="entity-delete-btn" onClick={(e) => handleDeleteEntity(e, entityName, entity.id)}>&times;</button>
            </div>
        </div>

    )
}
export default EntityCard
