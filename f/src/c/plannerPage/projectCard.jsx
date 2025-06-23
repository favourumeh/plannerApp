import "./parentCard.css"
import ProjectInfoCard from "../InfoCards/projectInfoCard"
import { ObjectiveCard } from "./objectiveCard"
import { useContext } from "react"
import { defaultObjective } from "../../staticVariables"

import globalContext from "../../context"
export function ProjectCard({entityName, project, projects, objectives, unscheduledTasks}) {
    const {currentObjective, setCurrentObjective, setFormProject, setForm, setIsModalOpen} = useContext(globalContext)
    const  projectsObjectives = objectives?.filter( (objective) => objective.projectId === project.id ) // the objectives of the project that have unscheduled tasks

    const handleClickAddBtn = (e) => {
        e.stopPropagation()
        setCurrentObjective({... !!currentObjective.id? defaultObjective : currentObjective, "projectId":project.id}) 
        setFormProject(project)
        setForm(`create-objective`)
        setIsModalOpen(true)
    }


    return (
        <div className="parent-card-container planner-project-container">
            <div className="planner-parent-title-row">

                 {/* <div className={`mutate-entity add-${entityName}-entity`}>
                    <button onClick={handleClickAddBtn}> <i className="fa fa-plus" aria-hidden="true"></i> </button>
                </div> */}

                <div className = "planner-parent-card-title planner-project-card-title"> 
                    {`${project.projectNumber} ${project.title}`} 
                    <ProjectInfoCard project={project} translate="-80% -120%"/>
                </div>

            </div> 

                { projectsObjectives?.map( (objective) =>
                <ObjectiveCard 
                    key={objective.id} 
                    objective={objective} 
                    projects={projects} 
                    objectives={objectives}
                    unscheduledTasks={unscheduledTasks}
                    translate={"-110% 0%"}/>
                ) }

        </div>
    )

}