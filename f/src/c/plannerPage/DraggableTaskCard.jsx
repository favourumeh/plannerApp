import { Draggable } from "./Draggable";
import { TaskCard } from "./taskCard";


export function DraggableTaskCard({task, projects, objectives, refetchPlannerTasks, translate}){
    return (
        <Draggable id={task.id}>
            <TaskCard task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} translate={translate}/>
        </Draggable>

    )

}