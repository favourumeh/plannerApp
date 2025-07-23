import "./kanbanColumn.css"
import { useContext } from "react"
import KanbanCard from "./kanbanCard"
import { useDroppable } from "@dnd-kit/core"
import globalContext from "../../context"
import { fetchDefaultProjectObjective, mutateEntityRequest } from "../../fetch_entities"
import { defaultTask, } from './../../staticVariables.js'
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"

export default function KanbanColumn ({columnId, columnTitle, taskArr, entityName, breakObjective, refetchKanbanContent}) {
    const {onShowHoverText, onHideHoverText, formatDateFields, handleNotification, handleLogout} = useContext(globalContext)
    const columnTaskArr = taskArr?.filter((task) => task.status==columnId)
    const {setNodeRef} = useDroppable({ id: columnId }) //dnd

    const { data: defaultProjectObjectiveResp, isPending: isPendingDefaultProjectObjective} = useQuery({ //get the default project objective
        queryKey: ["defaultObjective", entityName],
        queryFn: () => fetchDefaultProjectObjective({ projectId:breakObjective?.projectId, handleNotification, handleLogout}),
        retry: 3,
        placeholderData: keepPreviousData, 
        enabled: columnTitle === "In Progress"
    })
    const defaultProjectObjective = isPendingDefaultProjectObjective? {} : defaultProjectObjectiveResp?.objectives[0]

    const addTaskMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: () => {
            refetchKanbanContent()
        }
    })
    const handleQuickAddTask = (e) => { // add a task or a break immeadiately to the In Progress kanban column
        e.stopPropagation()
        const now = new Date( new Date().getTime() - new Date().getTimezoneOffset()*60*1000 )
        const isBreak = e.ctrlKey? true : false
        addTaskMutation.mutate({
            action: "create",
            entityName: entityName,
            currentEntity: formatDateFields({
                ...defaultTask, 
                description: isBreak? "quick break":"quick task", 
                status: "In-Progress", 
                scheduledStart: now, 
                start: now, 
                objectiveId: isBreak? breakObjective.id : defaultProjectObjective.id, 
            }),
            handleNotification,
            handleLogout,
        })
    }

    const quickAddDropdown = (
            <i 
                className="fa fa-plus quick-add-btn" 
                aria-hidden="true"
                onClick = {(e) => handleQuickAddTask(e)}
                onMouseEnter={() => onShowHoverText("Click to add a quick task. CTRL + Click to add a quick break")}
            >
                
            </i>
    )
    return (
        <>
            <div ref = {setNodeRef} id={columnId} className="kanban-column"> 
                {columnTitle!=="In Progress"? "" : quickAddDropdown}
                {`${columnTitle} [${columnTaskArr.length}]`} 
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