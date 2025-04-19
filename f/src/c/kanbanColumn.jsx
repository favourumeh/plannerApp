import "./kanbanColumn.css"
import { useState, useEffect, useContext } from "react"
import KanbanCard from "./kanbanCard"
import { useDroppable } from "@dnd-kit/core"
import globalContext from "../context"

export default function KanbanColumn ({columnId, columnTitle, entityArr, entityName}) {
    if (entityName !=="task" && columnId ===  "Paused") return
    const [columnEntityArr, setColumnEntityArr] = useState([])
    const {onShowHoverText, onHideHoverText} = useContext(globalContext)

    useEffect ( () => {
        setColumnEntityArr(entityArr.filter((entity) => entity.status==columnId))
    }, [entityArr])

    const {setNodeRef} = useDroppable({ id: columnId }) //dnd

    const getHoverText = (entity) => {
        if (entityName !=="task") {
            return "Title: " + entity.title + "\nDesc: " + entity.description
        } 
        return "Desc: " + entity.description
    }
    return (
        <>
            <div ref = {setNodeRef} id={columnId} className="kanban-column"> {`${columnTitle} [${columnEntityArr.length}]`} 
                {columnEntityArr.map( 
                    (columnEntity) => 
                        <div key={columnEntity.id}
                            className="kanban-item-overlay"
                            onMouseEnter={() => onShowHoverText(getHoverText(columnEntity))}
                            onMouseLeave={onHideHoverText}
                        >
                            <KanbanCard entity={columnEntity} entityName={entityName}/> 
                        </div>
                    )}
            </div>
        </>
    )

}