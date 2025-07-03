import "./kanbanColumn.css"
import { useContext } from "react"
import KanbanCard from "./kanbanCard"
import { useDroppable } from "@dnd-kit/core"
import globalContext from "../../context"

export default function KanbanColumn ({columnId, columnTitle, taskArr, entityName, refetchKanbanContent}) {
    const {onShowHoverText, onHideHoverText} = useContext(globalContext)
    const columnTaskArr = taskArr?.filter((task) => task.status==columnId)
    const {setNodeRef} = useDroppable({ id: columnId }) //dnd
    return (
        <>
            <div ref = {setNodeRef} id={columnId} className="kanban-column"> {`${columnTitle} [${columnTaskArr.length}]`} 
                {columnTaskArr.sort((a, b) => // sort the tasks in a kanaban column by start date
                    new Date(a.start) - new Date(b.start)).map( 
                    (columnTask) => 
                        <div key={columnTask.id}
                            className="kanban-item-overlay"
                            onMouseEnter={() => onShowHoverText("Desc: " + columnTask.description)}
                            onMouseLeave={onHideHoverText}
                        >
                            <KanbanCard task={columnTask} entityName={entityName} refetchKanbanContent={refetchKanbanContent}/> 
                        </div>
                    )}
            </div>
        </>
    )

}