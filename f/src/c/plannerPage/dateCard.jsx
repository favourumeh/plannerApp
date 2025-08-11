
import "./dateCard.css"
import { useContext, useEffect, useRef, useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { genereateWorkloadFill } from "../../utils/plannerUtilis"
import localPlannerPageContext from "./localPlannerPageContext"
import globalContext from "../../context"
import { defaultObjective, defaultProject, defaultTask } from "../../staticVariables"
import { datetimeToString, formatTotalMins } from "../../utils/dateUtilis"
import { DraggableTaskCard } from "./DraggableTaskCard"

export function DateCard({date, isPendingScheduled, tasks, projects, objectives,refetchPlannerTasks}) {
    const { isExpandAllDateCards, maxDailyWorkingHours, isExcludeBreakHours, bulkMode, idsOfTasksToUpdate, setIdsOfTasksToUpdate, updatedTasks, isPreviewBulkShift } = useContext(localPlannerPageContext)
    const [ isExpanded, setIsExpanded ] = useState(isExpandAllDateCards)
    const [ maxWorkloadBarWidth, setMaxWorkloadBarWidth ] = useState(309)
    const [ isDateCardSelected, setIsDateCardSetlected] = useState(false)
    const { setCurrentTask, setForm, setFormProject, setFormObjective, setIsModalOpen, setSitePage, setCurrentDate, handleNotification } = useContext(globalContext)
    const taskFilter = (task) => {
        if (!!task.start){
            return (datetimeToString(new Date(task.start)) === date.split(" ")[1])
        }
        return (datetimeToString(new Date(task.scheduledStart)) === date.split(" ")[1])
    }
    const filterOutMovingTasks = (task) => !idsOfTasksToUpdate.includes(task.id)
    const tasksAndPreview = !isPreviewBulkShift ? tasks : [...tasks?.filter(filterOutMovingTasks), ...updatedTasks]
    const daysTasks = tasksAndPreview?.filter(taskFilter)

    const calcTotalTaskDuration  = (task) => {
        if (!isExcludeBreakHours) {return (task.duration || task.durationEst)}

        const taskObjective = objectives.find( (objective) => objective.id === task.objectiveId )
        if (taskObjective?.type === "break"){
            return 0
        } else return (task.duration || task.durationEst)
    }

    const totalTaskMins = daysTasks.reduce((acc, task)=> acc + calcTotalTaskDuration(task), 0)

    const handleExpandedDayCard = ()  => {
        setIsExpanded(!isExpanded)
    }
    const {setNodeRef} = useDroppable({ id: date }) //dnd

    useEffect(() => {
        if (!isExpanded){ // expand dateCard to show tasks if dateCard is constricted when the number of dayTasks changes. 
            setIsExpanded(true)
        }

        if (daysTasks.length===0) { // constrict datecard when there are no tasks scheduled for date
            setIsExpanded(false)
        }
    }, [daysTasks.length])

    useEffect(()=> { // expand/constrict all date cards
        setIsExpanded(isExpandAllDateCards)
    }, [isExpandAllDateCards])

    const styleDateCardTitle = {color: daysTasks.length === 0? "red" : "white"}
    const styleDateCard = {border:  + ( datetimeToString(new Date()) == datetimeToString(new Date(date.split(" ")[1])) )? "2px solid rgb(0,230,0)" : "1px solid" }

   // Create a workload bar to highlight the density of tasks scheduled for the day
    const headerDiv = useRef(null)
    useEffect(() => {
        if (headerDiv.current) {
            setMaxWorkloadBarWidth(headerDiv.current.offsetWidth)
        }
    }, [])
   
    const isTodayOrFuture = new Date(date.split(" ")[1]) >= new Date( datetimeToString(new Date()))
    const workloadBarStyle = {
        width: `${ Math.min(1, (totalTaskMins/60)/maxDailyWorkingHours )*maxWorkloadBarWidth}px`,
        backgroundColor: genereateWorkloadFill(totalTaskMins/60),
    }

    const handleClickAddBtn = (e) => {
        e.stopPropagation()
        setCurrentTask({... defaultTask, scheduledStart: date.split(" ")[1]})
        setFormProject(defaultProject) // makes project field empty in create-task form
        setFormObjective(defaultObjective) // makes objective field ...
        setForm(`create-task`)
        setIsModalOpen(true)
    }

    const openKanbanView = (e) => {// opens that kaban view for the date card
        e.stopPropagation()
        if (e.ctrlKey){
            setSitePage("view-kanban")
            setCurrentDate(new Date(date.split(" ")[1]))
        } else {
            handleNotification(`Use 'CTRL + Click' to open Kanban view for ${date}`, "failure")
        }
    }

    const handleSelectDateCard = (e) => { // adds all tasks under date card to update list when datecard is ticked. Also removes all tasks when unticked. 
        e.stopPropagation()
        const isDateCardSelected_ = !isDateCardSelected
        const updateTaskIds = daysTasks.reduce((acc, task) => {
            return acc.concat(task.id)
        },[])
        if (isDateCardSelected_) {
            setIdsOfTasksToUpdate(prev => [...prev, ...updateTaskIds])
        } else {
            setIdsOfTasksToUpdate( prev => prev.filter( taskId => !updateTaskIds.includes(taskId) ) )
        }
        setIsDateCardSetlected(isDateCardSelected_)
    }

    useEffect( ()=> { // unticks date card when all tasks under it are unticked and vice versa
        if (bulkMode){
            const idsOfdateCardsSelectedTasks = daysTasks.reduce((acc, task)=> idsOfTasksToUpdate.includes(task.id)? acc.concat(task.id) : acc , [])
            if (idsOfdateCardsSelectedTasks.length === 0 ) {
                setIsDateCardSetlected(false)
            }

            if ( idsOfdateCardsSelectedTasks.length === daysTasks.length && daysTasks.length !==0){
                setIsDateCardSetlected(true)
            }
        }
    }, [idsOfTasksToUpdate])

    useEffect(()=> { // untick datecard when bulk mode is false
        if (!bulkMode) {
            setIsDateCardSetlected(false)
        }
    }, [bulkMode])

    return (
        <div ref={setNodeRef} id={date} className="planner-date-container" style={styleDateCard}>
            <div className="planner-date-container-header-row">
                <div className={`mutate-entity add-task-entity side-btn`}>
                    {bulkMode? 
                        isDateCardSelected? <i className="fa fa-check-square-o" aria-hidden="true" onClick={handleSelectDateCard} />:
                        <i className="fa fa-square-o side-btn" aria-hidden="true" onClick={handleSelectDateCard} />: 
                        <i className="fa fa-plus side-btn" aria-hidden="true" onClick={handleClickAddBtn} /> }
                </div>

                <div ref ={headerDiv} className="planner-date-container-header" >
                    {isTodayOrFuture?  <div className="workload-bar" style={workloadBarStyle}></div>: undefined}
                    <div 
                        className="date-card-title" 
                        style={styleDateCardTitle}
                        onClick={openKanbanView}
                    > {date} #{isPendingScheduled? "..." : daysTasks.length } ({formatTotalMins(totalTaskMins)})
                    </div>
                </div>

                <div onClick={handleExpandedDayCard} className="date-card-expand-btns side-btn">
                    {isExpanded? 
                        <i className="fa fa-caret-up side-btn" aria-hidden="true"></i>
                        : <i className="fa fa-caret-down side-btn" aria-hidden="true"></i>
                    }
                </div>
            </div>

            {isExpanded? 
                daysTasks?.sort((a, b) => // sort the tasks in the date card by the start time
                    new Date(a.start) - new Date(b.start)).map((task, index) =>
                    <DraggableTaskCard key={`${task.id}-${index}`} task={task} projects={projects} objectives={objectives} refetchPlannerTasks={refetchPlannerTasks} isDateCardSelected={isDateCardSelected} translate="100% -0%"/>
                )
                : undefined    
            }
        </div>
    )

}