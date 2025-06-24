import "./parentCard.css"
import { TaskCard } from "./taskCard"
import ObjectiveInfoCard from "../InfoCards/objectiveInfoCard"
import globalContext from "../../context"
import { useContext } from "react"
import { defaultTask } from "../../staticVariables"
import { useMutation } from "@tanstack/react-query"
import { mutateEntityRequest } from "../../fetch_entities"

export function ObjectiveCard({entityName, objective, projects, objectives, unscheduledTasks, refetchPlannerTasks, translate}) {
    const {setCurrentObjective,setCurrentTask, setForm, setFormProject, setFormObjective, setIsModalOpen, handleNotification, handleLogout} = useContext(globalContext)
    const unscheduledTasksOfObjective = unscheduledTasks?.filter((task) => task.objectiveId === objective.id )
    const project = projects?.find( project => project.id === objective.projectId )

    const deleteEntityMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: refetchPlannerTasks,
    })

    const handleClickDeleteBtn = (e) => {
        e.stopPropagation()

        if (e.ctrlKey) {
            deleteEntityMutation.mutate({
                action: "delete",
                entityName: "objective",
                currentEntity: objective,
                handleNotification,
                handleLogout
            })
        } else {
            handleNotification(`Hold down ctrl key to delete ${entityName}`, "error")
        }

    }

    const onClickObjectiveCard = () => {
        setCurrentObjective(objective)
        setForm(`update-objective`)
        setIsModalOpen(true)
    }
    const handleClickAddBtn = (e) => {
        e.stopPropagation()
        setCurrentTask({... defaultTask, scheduledStart: null}) 
        setFormProject(project)
        setFormObjective(objective)
        setForm(`create-task`)
        setIsModalOpen(true)
    }

    return (
        <div className="parent-card-container planner-objective-container">
            
            <div className="planner-parent-title-row  planner-objective-title-row">

                 <div className={`mutate-entity add-${entityName}-entity`}>
                    <i className="fa fa-plus" aria-hidden="true"  onClick={handleClickAddBtn} ></i> 
                </div>

                <div 
                    className = "planner-parent-card-title planner-objective-card-title"
                    onClick={onClickObjectiveCard}
                > {`${objective.objectiveNumber} ${objective.title}`} 
                    <ObjectiveInfoCard objective ={objective} objectiveProject={project} translate={translate}/>
                </div> 

                <div className={`mutate-entity delete-${entityName}-entity`}>
                    <i className="fa fa-times" aria-hidden="true" onClick={handleClickDeleteBtn} ></i>
                </div>
            </div>

            { unscheduledTasksOfObjective?.map( (task) =>
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    projects={projects} 
                    objectives={objectives}
                    refetchPlannerTasks={refetchPlannerTasks}
                    translate="-90% -100%"/>
            ) }
        </div>
    )
}