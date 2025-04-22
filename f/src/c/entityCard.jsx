import "./entityCard.css"
import { useContext} from "react"
import globalContext from "../context"
import TaskInfoCard from "./InfoCards/taskInfoCard"
import ObjectiveInfoCard from "./InfoCards/objectiveInfoCard"
import ProjectInfoCard from "./InfoCards/projectInfoCard"

function EntityCard ({entity, entityName}) {
    const {
        setForm, setIsModalOpen, objectives, projects, 
        setCurrentTask, setCurrentProject, setCurrentObjective, 
        handleDeleteEntity, getObjective, getProject} = useContext(globalContext)

    const project = getProject(entity, entityName, projects, objectives)
    const objective  = getObjective(entity, entityName, objectives)

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

    const chooseInfoCard = () => {
        switch (entityName){
            case ("project"):
                return <ProjectInfoCard project={entity} translate="122% 0%" />
            case ("objective"):
                return <ObjectiveInfoCard objective={entity} objectiveProject={project} translate="122% 0%"/>
            case ("task"):
                return <TaskInfoCard task={entity} taskObjective={objective} taskProject={project} translate="122% 0%"/>
            default:
                return
        }
    }

    return (
        <div id={`row-id-${entity.id}`} className="entity-row">
            {chooseInfoCard()}
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
