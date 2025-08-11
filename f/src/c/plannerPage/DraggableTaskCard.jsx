import { DragOverlay } from "@dnd-kit/core";
import { Draggable } from "./Draggable";
import { TaskCard } from "./taskCard";
import { useContext } from "react";
import { createPortal } from "react-dom";
import localPlannerPageContext from "./localPlannerPageContext";


export function DraggableTaskCard({task, projects, objectives, refetchPlannerTasks, isDateCardSelected, translate}) {
    const { activeId } = useContext(localPlannerPageContext)
    return (
        <>
            <Draggable id={task.id}>
                <TaskCard task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} isDateCardSelected={isDateCardSelected} translate={translate}/>
            </Draggable>
            {createPortal( // -1 -2
                <DragOverlay dropAnimation={null}>
                    {(activeId===task.id)? (
                        <TaskCard task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} translate={translate}/>
                    ): null}
                </DragOverlay>, document.body
            )}
        </>
    )
}

/*
    -1: doc link: https://docs.dndkit.com/api-documentation/draggable/drag-overlay
    -1: DragOverlay creates a preview of the draggable items that is removed from normal document flow AND distinct from the actual draggable item. 
        It lets the user view the drag position of a draggable item without having to directly translate the item via element styling and useDraggable ( i.e.,  {transform} = useDraggable(...)).
        It is good for situations where you are dragging across scrollable, droppable columns. 
        This is because moving the draggable item's element from a scrollable column interacts with the scrolling and as scrolling is "endless" the draggable item never exits the scrollable column 
        thus the items styling translation is restrained to scollable column.  
    -2: create portal allows the user move draggable items accross different containers in the DOM. 
        This is required as dragOverlay is not rendered in the portal by default but rather in the container where it is rendered 
*/