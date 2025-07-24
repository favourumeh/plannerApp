import "./progressCard.css"
import { useContext } from "react"
import { useMutation } from "@tanstack/react-query"
import globalContext from "../../context"
import TaskInfoCard from "../InfoCards/taskInfoCard"
import { colourDict } from "../../utils/progressUtils"
import { mutateEntityRequest } from "../../fetch_entities"

export default function TaskProgressCard ({entity, entityName, project, objective, refetchAfterTaskDeletion}) {
    const {setCurrentTask, setForm, setIsModalOpen, handleNotification, handleLogout } = useContext(globalContext)

    // use useMutation to delete a task
    const deleleTaskMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: () => {
            refetchAfterTaskDeletion()
            // handleNotification("Task deleted successfully", "success")
        }
    })
    //handle clicking delete-entity button
    const handleDeleteEntity = (e) => {
        e.stopPropagation()
        if (e.ctrlKey) {
            deleleTaskMutation.mutate({
                action: "delete",
                entityName: entityName,
                currentEntity: entity,
                handleNotification: handleNotification,
                handleLogout: handleLogout
            })
        } else {
            handleNotification(`Use 'CTRL + Click' to delete ${entityName} '${entity.description.length > 20? entity.description.slice(0, 20) + "..." : entity.description}' `, "failure")
        }
    }

    const generateTaskStatusSymbol = () => {
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

    //Open an "update-task" form
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        setCurrentTask(entity)
        setIsModalOpen(true)
    }

    return (
        <div className={`progress-card-container  ${entityName}-card-container`}>
            <div className="progress-card-row">
                <div 
                    className={`progress-card-overlay ${entityName}-card-overlay`}
                    onClick={onClickEditBtn}
                >
                    <TaskInfoCard task={entity} taskObjective={objective} taskProject={project} translate="155% -50%"/>
                    <div className="progress-bar">
                        <div className="progress-bar-fill" 
                            style={{"width":"0%"}}
                        >
                        </div>

                        <div className="progress-card-content">{entity.taskNumber + " " + entity.description}</div>
                    </div>

                    <div className="progress-card-tools">
                        {generateTaskStatusSymbol()}
                    </div>
                </div>
                <div className={`mutate-entity add-${entityName}-entity`}>
                    <button onClick={handleDeleteEntity}> <i className="fa fa-times" aria-hidden="true"></i> </button>
                </div>
            </div>
        </div>

    )
}
