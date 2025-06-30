import "./parentCard.css"
import { TaskCard } from "./taskCard"
import ObjectiveInfoCard from "../InfoCards/objectiveInfoCard"
import globalContext from "../../context"
import { useContext, useEffect, useState } from "react"
import { defaultTask } from "../../staticVariables"
import { useMutation } from "@tanstack/react-query"
import { mutateEntityRequest } from "../../fetch_entities"
import localPlannerPageContext from "./localPlannerPageContext"

export function ObjectiveCard({entityName, objective, projects, objectives, unscheduledTasks, isExpandAllUnscheduledEntities, refetchPlannerTasks, translate}) {
    const {setCurrentObjective,setCurrentTask, setForm, setFormProject, setFormObjective, setIsModalOpen, handleNotification, handleLogout} = useContext(globalContext)
    const { scrollPosition } = useContext(localPlannerPageContext)
    const [isExpanded, setIsExpanded] = useState(false) // state to track if the objective card is expanded to show objectives
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

    const onDoubleClickObjectiveCard = () => {
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

    const handleEntityExpansion = (e) => { // expands or constricts a specific objective card
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    useEffect(()=> { // expand/constrict all unsheduled entities
        setIsExpanded(isExpandAllUnscheduledEntities)
    }, [isExpandAllUnscheduledEntities])


    useEffect(() => { 
        if (!isExpanded && unscheduledTasksOfObjective.length > 0) { // expand objective card to show tasks if objective card is constricted when the number of unscheduledTasksOfObjective changes.
            setIsExpanded(true)
        }
        if (unscheduledTasksOfObjective.length === 0) { // constrict objective card when there are no unscheduled tasks
            setIsExpanded(false)
        }
    }, [unscheduledTasksOfObjective.length])

    return (
        <div className="parent-card-container planner-objective-container">
            
            <div className="planner-parent-title-row  planner-objective-title-row">

                 <div className={`mutate-entity add-${entityName}-entity`}>
                    <i className="fa fa-plus side-btn" aria-hidden="true"  onClick={handleClickAddBtn} ></i> 
                </div>

                <div 
                    className = "planner-parent-card-title planner-objective-card-title"
                    onDoubleClick={onDoubleClickObjectiveCard}
                > 
                    <div className="planner-parent-card-title-content">
                        {`${objective.objectiveNumber} ${objective.title}`} 
                    </div>
                    
                    <div>
                        {isExpanded? 
                            <i className="fa fa-caret-up dropdown-btn" aria-hidden="true" onClick={handleEntityExpansion}></i>
                            : <i className="fa fa-caret-down dropdown-btn" aria-hidden="true" onClick={handleEntityExpansion}></i>
                        }
                    </div>

                </div> 

                <div className={`mutate-entity delete-${entityName}-entity`}>
                    <i className="fa fa-times side-btn" aria-hidden="true" onClick={handleClickDeleteBtn} ></i>
                </div>
                <ObjectiveInfoCard objective ={objective} objectiveProject={project} translate={translate}/>
            </div>

            {isExpanded?
                unscheduledTasksOfObjective?.map( (task) =>
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        projects={projects} 
                        objectives={objectives}
                        refetchPlannerTasks={refetchPlannerTasks}
                        translate={`120% calc( -50% - ${scrollPosition}px)`}/>
                        // translate="115% -50%"/>
                ) : undefined
            }
        </div>
    )
}