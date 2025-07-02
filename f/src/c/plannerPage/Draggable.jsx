
import { useDraggable } from "@dnd-kit/core"

export function Draggable({id, children}) {
    const { attributes, listeners, setNodeRef } = useDraggable({ id: id}) //dnd
    return (
        <div className="planner-task-card-container"
            ref={setNodeRef} 
            {...listeners}
            {...attributes}
        >
            {children}
        </div>
    )
}