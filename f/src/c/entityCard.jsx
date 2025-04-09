import "./entityCard.css"
import { useState, useEffect, useContext} from "react"
import globalContext from "../context"

function EntityCard ({entity, entityName}) {
    const {sitePage, setForm, setIsModalOpen, objectives, projects, setCurrentTask, setCurrentProject, setCurrentObjective, handleDeleteEntity} = useContext(globalContext)

    const findTaskObjective = (task) => objectives.find((objective)=> objective.id===task.objectiveId )
    const findObjectiveProject = (objective) => projects.find((project)=> project.id===objective.projectId)

    const getProjectNumber = (entity) => {
        if (entityName === "task") {
            return findObjectiveProject(findTaskObjective(entity))["projectNumber"]
        } else if (entityName === "objective") {
            return findObjectiveProject(entity)["projectNumber"]
        } else {
            return entity["projectNumber"]
        }
    }

    const getObjectiveNumber = (entity) => {
        if (entityName === "task") {
            return findTaskObjective(entity)["objectiveNumber"]
        } else if (entityName === "objective") {
            return entity["objectiveNumber"]
        } else {
            return null
        }
    }

    const [projectNumber, setProjectNumber] = useState(getProjectNumber(entity)) 
    const [objectiveNumber, setObjectiveNumber] = useState(getObjectiveNumber(entity) )

    useEffect(()=>{
        setProjectNumber(getProjectNumber(entity))
        setObjectiveNumber(getObjectiveNumber(entity))}, [sitePage])

    const handleEditEntity = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        entityName==="task"? setCurrentTask(entity): entityName==="objective"? setCurrentObjective(entity): setCurrentProject(entity)
        setIsModalOpen(true)
    }

    const generateCardContent = () => {
        if (entityName==="task") {
            return `Task ${projectNumber}.${objectiveNumber}.${entity.taskNumber}`
        } else if (entityName==="objective") {
            return `Objective ${projectNumber}.${objectiveNumber}`
        } else {
            return `Project ${projectNumber}`
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
