import "./parentCard.css"
import { TaskCard } from "./taskCard"
import ObjectiveInfoCard from "../InfoCards/objectiveInfoCard"
export function ObjectiveCard({entityName, objective, projects, objectives, unscheduledTasks}) {
    const unscheduledTasksOfObjective = unscheduledTasks?.filter((task) => task.objectiveId === objective.id )
    const project = projects?.find( project => project.id === objective.projectId )

    return (
        <div className="parent-card-container planner-objective-container">

            <div className="planner-parent-title-row">

                <div className = "planner-parent-card-title planner-objective-card-title"> {`${objective.objectiveNumber} ${objective.title}`} 
                    <ObjectiveInfoCard objective ={objective} objectiveProject={project} translate="-80% -120%"/>
                </div> 
            </div>
            { unscheduledTasksOfObjective?.map( (task) =>
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    projects={projects} 
                    objectives={objectives} 
                    translate="-90% -100%"/>
            ) }
        </div>
    )
}