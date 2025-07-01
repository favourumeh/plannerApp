
import { useDraggable } from "@dnd-kit/core"

export function Draggable({id, children}) {
    const { attributes, listeners, setNodeRef, transform} = useDraggable({ id: id}) //dnd
    const style = transform ? {transform: `translate(${transform.x}px, ${transform.y}px)`} : undefined; //dnd keeps track of x-y coordinate of task card

    return (
        <div className="planner-task-card-container"
            ref={setNodeRef} 
            {...listeners}
            {...attributes} 
            style={style}
        >
            {children}
        </div>
    )
}