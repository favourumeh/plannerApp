
import { useDraggable } from "@dnd-kit/core"
import localPlannerPageContext from "./localPlannerPageContext"
import { useContext } from "react"

export function Draggable({id, children}) {
    const { isDragging, activeId } = useContext(localPlannerPageContext)
    const { attributes, listeners, setNodeRef } = useDraggable({ id: id}) //dnd
    return (
        <div className="draggable-item"
            ref={setNodeRef} 
            {...listeners}
            {...attributes}
            style={ { opacity: ( isDragging && activeId===id ) ? 0.3:1, } }
        >
            {children}
        </div>
    )
}