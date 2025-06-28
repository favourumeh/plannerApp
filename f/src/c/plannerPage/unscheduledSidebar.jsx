
import "./unscheduledSidebar.css"
import { TaskCard } from "./taskCard"
import { ProjectCard } from "./projectCard"
import { useDroppable } from "@dnd-kit/core"
import localPlannerPageContext from "./localPlannerPageContext"
import { useContext } from "react"

export function UnscheduledSidebar({unscheduledTasks, projects, objectives, isJustUnscheduledTask, isExpandAllUnscheduledEntities, refetchPlannerTasks}) {
    const { isExcludeBreakHours } = useContext(localPlannerPageContext)

    const calcTotalTaskDuration  = (task) => {
        if (!isExcludeBreakHours) {return (task.duration || task.durationEst)}

        const taskObjective = objectives.find( (objective) => objective.id === task.objectiveId )
        if (taskObjective?.type === "break"){
            return 0
        } else return (task.duration || task.durationEst)
    }

    const totalTaskMins = unscheduledTasks.reduce((acc, task)=> acc + calcTotalTaskDuration(task), 0)
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
                    <TaskCard key={task.id} task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} translate="120% -50%"/>
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
                        isExpandAllUnscheduledEntities={isExpandAllUnscheduledEntities}
                        refetchPlannerTasks={refetchPlannerTasks}
                        translate="135% -50%"/>

                )

            }


        </div>
    )
}