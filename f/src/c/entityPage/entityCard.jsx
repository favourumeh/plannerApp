import "./entityCard.css"
import { useContext} from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import readTasksObjectiveAndProjectQueryOption from "../../queryOptions/readTasksObjectiveAndProjectQueryOption"
import readObjectivesProjectQueryOption from "../../queryOptions/readObjectivesProjectQueryOption"
import globalContext from "../../context"
import TaskInfoCard from "../InfoCards/taskInfoCard"
import ObjectiveInfoCard from "../InfoCards/objectiveInfoCard"
import ProjectInfoCard from "../InfoCards/projectInfoCard"
import { mutateEntityRequest } from "../../fetch_entities"

function EntityCard ({entity, entityName, projects, objectives, refetchEntityPageContent}) {
    const {
        setForm, setIsModalOpen, 
        setCurrentTask, setCurrentProject, setCurrentObjective, 
        handleNotification, handleLogout} = useContext(globalContext)

    const deleteTaskMutation = useMutation({ 
        mutationFn: mutateEntityRequest,
        onSuccess: refetchEntityPageContent,
    })

    const handleDeleteEntity = (e) =>  {
        e.preventDefault()

        if ( e.ctrlKey) {
            deleteTaskMutation.mutate({
                action: "delete",
                entityName: entityName,
                currentEntity: entity,
                handleNotification: handleNotification,
                handleLogout: handleLogout
            })
        } else {
            handleNotification(`Use 'CTRL + Click' to delete ${entityName} `, "failure")
        }
    }

    const {data: objectiveParent, isPending: isPendingObjectiveParent} = useQuery( { //objectiveParent = the objective's project
        ...readObjectivesProjectQueryOption(entity.id, handleNotification, handleLogout),
        enabled: entityName==="objective",
    })

    const handleEditEntity = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        entityName==="task"? setCurrentTask(entity): entityName==="objective"? setCurrentObjective(entity): setCurrentProject(entity)
        setIsModalOpen(true)
    }

    if (entityName === "task"){
        var taskObjective = objectives?.find( (objective) => objective.id == entity.objectiveId )
        var taskProject = projects?.find( (project) => project.id === taskObjective.projectId )
    }
    const generateCardContent = () => {
        if (entityName==="task") {
            return `Task ${taskProject.projectNumber}.${taskObjective.objectiveNumber}.${entity.taskNumber}`
        } else if (entityName==="objective") {
            return `Objective ${isPendingObjectiveParent? "*" : objectiveParent.project.projectNumber}.${entity.objectiveNumber}`
        } else {
            return `Project ${entity.projectNumber}`
        }
    }

    const chooseInfoCard = () => {
        switch (entityName){
            case ("project"):
                return <ProjectInfoCard project={entity} translate="122% 0%" />
            case ("objective"):
                return <ObjectiveInfoCard objective={entity} objectiveProject={isPendingObjectiveParent?  {"title":"*"}: objectiveParent.project } translate="122% 0%"/>
            case ("task"):
                return <TaskInfoCard task={entity} taskObjective={taskObjective} taskProject={taskProject} translate="122% 0%"/>
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
                <button id={`delete-entity-id-${entity.id}`} className="entity-delete-btn" onClick={(e) => handleDeleteEntity(e)}>&times;</button>
            </div>
        </div>

    )
}
export default EntityCard
