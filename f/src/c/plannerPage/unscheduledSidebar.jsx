
import "./unscheduledSidebar.css"
import { TaskCard } from "./taskCard"
import { ProjectCard } from "./projectCard"
import { useDroppable } from "@dnd-kit/core"

export function UnscheduledSidebar({unscheduledTasks, projects, objectives, isJustUnscheduledTask, refetchPlannerTasks}) {
    // console.log("unScheduled tasks", unscheduledTasks)
    const totalTaskMins = unscheduledTasks.reduce((acc, task)=> acc + (task.duration || task.durationEst), 0)

    const {setNodeRef} = useDroppable({ id: "Unscheduled-Tasks-List" }) //dnd

    const displayedTaskDuration = () => {
        if (totalTaskMins < 60) {
            return `${totalTaskMins}mins`
        } else {
            const totalTaskHours = totalTaskMins/60
            const minRemainder = Math.abs(Math.round(60*(Math.floor(totalTaskHours) - totalTaskHours)))
            return `${Math.floor(totalTaskMins/60)}hrs ${minRemainder}mins`
        }
    }
    
    return (
        <div ref={setNodeRef} id="Unscheduled-Tasks-List" className="planner-unscheduled-container"> 
            <div> Unscheduled Tasks #{unscheduledTasks.length} ({displayedTaskDuration()}) </div> 

            {isJustUnscheduledTask? 
                unscheduledTasks?.map((task)=> 
                    <TaskCard key={task.id} task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} translate="-90% -100%"/>
                )
                :
                projects?.map( (project) => 
                    <ProjectCard 
                        key={project.id}
                        entityName="project"
                        project={project} 
                        projects={projects} 
                        objectives={objectives} 
                        unscheduledTasks={unscheduledTasks}
                        refetchPlannerTasks={refetchPlannerTasks}
                        translate="-80% -120%"/>

                )

            }


        </div>
    )
}