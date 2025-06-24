import "./parentCard.css"
import ProjectInfoCard from "../InfoCards/projectInfoCard"
import { ObjectiveCard } from "./objectiveCard"
import { useContext } from "react"
import { defaultObjective } from "../../staticVariables"

import globalContext from "../../context"
import { useMutation } from "@tanstack/react-query"
import { mutateEntityRequest } from "../../fetch_entities"

export function ProjectCard({entityName, project, projects, objectives, unscheduledTasks, refetchPlannerTasks, translate}) {
    const {setCurrentProject, setCurrentObjective, setFormProject, setForm, setIsModalOpen, handleNotification, handleLogout} = useContext(globalContext)
    const  projectsObjectives = objectives?.filter( (objective) => objective.projectId === project.id ) // the objectives of the project that have unscheduled tasks

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

    const onClickProjectCard = () => {
        setCurrentProject(project)
        setForm(`update-project`)
        setIsModalOpen(true)
    }

    return (
        <div className="parent-card-container planner-project-container">
            <div className="planner-parent-row planner-project-row">
                <div className="planner-parent-title-row planner-project-title-row">

                    <div className={`mutate-entity add-${entityName}-entity`}>
                        <i className="fa fa-plus" aria-hidden="true" onClick={handleClickAddBtn} ></i> 
                    </div>

                    <div 
                        className = "planner-parent-card-title planner-project-card-title"
                        onClick = {onClickProjectCard}
                    > 
                        {`${project.projectNumber} ${project.title}`} 
                        <ProjectInfoCard project={project} translate={translate}/>
                    </div>

                    <div className={`mutate-entity delete-${entityName}-entity`}>
                        <i className="fa fa-times" aria-hidden="true"  onClick={handleClickDeleteBtn} ></i>
                    </div>
                </div> 

                { projectsObjectives?.map( (objective) =>
                <ObjectiveCard 
                    key={objective.id}
                    entityName="objective" 
                    objective={objective} 
                    projects={projects} 
                    objectives={objectives}
                    unscheduledTasks={unscheduledTasks}
                    refetchPlannerTasks={refetchPlannerTasks}
                    translate="-80% -120%"/>
                ) }

            </div>

        </div>
    )

}