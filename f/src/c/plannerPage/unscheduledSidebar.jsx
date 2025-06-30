
import "./unscheduledSidebar.css"
import { TaskCard } from "./taskCard"
import { ProjectCard } from "./projectCard"
import { useDroppable } from "@dnd-kit/core"
import localPlannerPageContext from "./localPlannerPageContext"
import { useContext, useRef } from "react"

export function UnscheduledSidebar({unscheduledTasks, projects, objectives, isJustUnscheduledTask, isExpandAllUnscheduledEntities, refetchPlannerTasks}) {
    const { isExcludeBreakHours, scrollPosition, setScrollPosition } = useContext(localPlannerPageContext)
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

    const divScroller = useRef(0)

    const handleScroll = (e) => { // records how far up/down in px the scroll bar has moved in the unscheduled section. This is used to keep the info card of an entity from drifting down relative to its entity as you scroll down. 
        setScrollPosition(e.target.scrollTop)
        // console.log("positon", e.target.scrollTop)
    }
    
    return (
        <div
            ref={divScroller} 
            className="planner-unscheduled-container-scroller-wrapper"
            onScroll={handleScroll}
            >
            <div 
                ref={setNodeRef} 
                id="Unscheduled-Tasks-List" 
                className="planner-unscheduled-container-droppable"
                > 
                <div> Unscheduled Tasks #{unscheduledTasks.length} ({displayedTaskDuration()}) </div> 

                {isJustUnscheduledTask? 
                    unscheduledTasks?.map((task)=> 
                        <TaskCard key={task.id} task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} translate="145% -50%"/>
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
                            translate={`140% calc( -50% - ${scrollPosition}px)`}/>
                            // translate="135% -50%"/>

                    )

                }
            </div>
        </div>

    )
}