import "./parentCard.css"
import ProjectInfoCard from "../InfoCards/projectInfoCard"
import { ObjectiveCard } from "./objectiveCard"
import { useContext, useEffect, useState } from "react"
import { defaultObjective } from "../../staticVariables"
import globalContext from "../../context"
import { useMutation } from "@tanstack/react-query"
import { mutateEntityRequest } from "../../fetch_entities"

export function ProjectCard({entityName, project, projects, objectives, unscheduledTasks, isExpandAllUnscheduledEntities, refetchPlannerTasks, translate}) {
    const {setCurrentProject, setCurrentObjective, setFormProject, setForm, setIsModalOpen, handleNotification, handleLogout} = useContext(globalContext)
    const [isExpanded, setIsExpanded] = useState(false) // state to track if the project card is expanded to show objectives
    const  projectsObjectives = objectives?.filter( (objective) => objective.projectId === project.id ) // the objectives of the project that have unscheduled tasks
    const objectvesOfProject = objectives?.filter( (objective) => objective.projectId === project.id )
    const objectiveIdsOfProject = objectvesOfProject?.map( (objective) => objective.id )
    const unScheduledTasksOfProject = unscheduledTasks?.filter((task) => objectiveIdsOfProject.includes(task.objectiveId) )

    const deleteEntityMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: refetchPlannerTasks,
    })

    const handleClickDeleteBtn = (e) => {
        if (e.ctrlKey) {
            e.stopPropagation()
            deleteEntityMutation.mutate({
                action: "delete",
                entityName: entityName,
                currentEntity: project,
                handleNotification,
                handleLogout
            })
        } else {
            handleNotification(`Hold down ctrl key to delete ${entityName}`, "error")
        }
    }

    const handleClickAddBtn = (e) => {
        e.stopPropagation()
        setCurrentObjective(defaultObjective) 
        setFormProject(project)
        setForm(`create-objective`)
        setIsModalOpen(true)
    }

    const onDoubleClickProjectCard = () => {
        setCurrentProject(project)
        setForm(`update-project`)
        setIsModalOpen(true)
    }
    const handleEntityExpansion = (e) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
    }

    useEffect(()=> { // expand/constrict all unscheduled entities
        setIsExpanded(isExpandAllUnscheduledEntities)
    }, [isExpandAllUnscheduledEntities])

    useEffect(() => { 
        if (!isExpanded && unScheduledTasksOfProject.length > 0) { // expand objective card to show tasks if objective card is constricted when the number of unscheduledTasksOfObjective changes.
            setIsExpanded(true)
        }
        if (unScheduledTasksOfProject.length === 0) { // constrict objective card when there are no unscheduled tasks
            setIsExpanded(false)
        }
    }, [unScheduledTasksOfProject.length])


    return (
        <div className="parent-card-container planner-project-container">
            <div className="planner-parent-row planner-project-row">

                <div className="planner-parent-title-row planner-project-title-row">
                    <div className={`mutate-entity add-${entityName}-entity`}>
                        <i className="fa fa-plus side-btn" aria-hidden="true" onClick={handleClickAddBtn} ></i> 
                    </div>

                    <div 
                        className = "planner-parent-card-title planner-project-card-title"
                        onDoubleClick = {onDoubleClickProjectCard}
                    > 
                        <div className="planner-parent-card-title-content">
                            {`${project.projectNumber} ${project.title}`} 
                        </div>
                        <div>
                            {isExpanded? 
                                <i className="fa fa-caret-up dropdown-btn" aria-hidden="true" onClick={handleEntityExpansion}></i>
                                : <i className="fa fa-caret-down dropdown-btn" aria-hidden="true" onClick={handleEntityExpansion}></i>
                            }
                        </div>
                    </div>

                    <div className={`mutate-entity delete-${entityName}-entity`}>
                        <i className="fa fa-times side-btn" aria-hidden="true"  onClick={handleClickDeleteBtn} ></i>
                    </div>
                    <ProjectInfoCard project={project} translate={translate}/>
                </div> 

                    {isExpanded? 
                        projectsObjectives?.map( (objective) =>
                        <ObjectiveCard 
                            key={objective.id}
                            entityName="objective" 
                            objective={objective} 
                            projects={projects} 
                            objectives={objectives}
                            unscheduledTasks={unscheduledTasks}
                            isExpandAllUnscheduledEntities={isExpandAllUnscheduledEntities}
                            refetchPlannerTasks={refetchPlannerTasks}
                            translate="-80% -100%"/>
                            // translate="-240px -240px"/>
                        ) : undefined

                    }

            </div>

        </div>
    )

}