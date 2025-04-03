import "./kanbanColumn.css"
import { useState, useEffect, useContext } from "react"
import KanbanCard from "./kanbanCard"
import { useDroppable } from "@dnd-kit/core"
import globalContext from "../context"

export default function KanbanColumn ({columnId, columnTitle, entityArr, entityName}) {
    const [columnEntityArr, setColumnEntityArr] = useState([])
    const {setForm, setIsModalOpen, setCurrentProject, setCurrentObjective, setCurrentTask} = useContext(globalContext)

    useEffect ( () => {
        setColumnEntityArr(entityArr.filter((entity) => entity.status==columnId))
    }, [entityArr])

    const {setNodeRef} = useDroppable({ id: columnId }) //dnd


    return (
        <>
            <div ref = {setNodeRef} id={columnId} className="kanban-column"> {`${columnTitle} [${columnEntityArr.length}]`} 
                {columnEntityArr.map( 
                    (columnEntity) => 
                        <div className="kanban-item-overlay">
                            <KanbanCard entity={columnEntity} entityName={entityName}/> 
                        </div>
                    )}
            </div>
        </>
    )

}