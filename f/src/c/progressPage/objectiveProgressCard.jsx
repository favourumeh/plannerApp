import "./progressCard.css"
import { useState, useContext, useRef, useEffect } from "react"
import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query"
import globalContext from "../../context"
import ObjectiveInfoCard from "../InfoCards/objectiveInfoCard"
import TaskProgressCard from "./taskProgressCard"
import { readObjectiveTasksQueryOption } from "../../queryOptions" 
import { fetchEntityProgress, mutateEntityRequest } from "../../fetch_entities"
import { generateProgressBarColour } from "../../utils/progressUtils"
import { defaultTask } from "../../staticVariables"
import { formatTaskMins } from "../../utils/dateUtilis"

export default function ObjectiveProgressCard ({entity, entityName, project, metric, refetchAfterObjectiveDeletion}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const { currentTask, setCurrentTask, setCurrentObjective,
            setForm, setIsModalOpen, setFormProject, setFormObjective, 
            handleNotification, handleLogout, isModalOpen } = useContext(globalContext)

    //useQuery to get the progress percentage of the project
    const {data: progressQuery, isPending: isProgressPending, refetch: refetchObjectiveProgress} = useQuery({
        queryKey: ["ObjectiveProgress", entity.id],
        queryFn: () => fetchEntityProgress({entityId: entity.id, entityName, handleNotification, handleLogout}),
        placeholderData: keepPreviousData,
        retry: 3,
    })

    //use useQuery to get the tasks of the objective 
    const {data: tasksQuery, isPending: isTasksPending, refetch: refetchTasks} = useQuery({
    ...readObjectiveTasksQueryOption(entity.id, handleNotification, handleLogout),
       enabled: isExpanded,
    })
    //handle metrics
    const progressPercentage = !isProgressPending? metric==="duration"? Math.round(progressQuery.progressPercentageDuration) : Math.round(progressQuery.progressPercentageCount) : "0"
    const completedTaskMetric = !isProgressPending? metric==="duration"? formatTaskMins(progressQuery.completedTaskDuration) : progressQuery.completedTaskCount : "..."
    const totalTaskMetric = !isProgressPending? metric==="duration"? formatTaskMins(progressQuery.totalTaskDuration) : progressQuery.totalTaskCount : "..."
    
    const rawMetricValues = (completedTaskMetric, totalTaskMetric) => {
        return  `${completedTaskMetric}/${totalTaskMetric}${metric==="duration"? "" : " tasks"}`
    }

    const tasks = isExpanded && !isTasksPending? tasksQuery.tasks : []

    useEffect(() => { // refresh the progress percentage and the underlying tasks when the objective is updated via the form modal
        if (!isModalOpen && !isProgressPending && !isTasksPending) {
            refetchObjectiveProgress()
            refetchTasks()
        }
    }, [isModalOpen, isProgressPending, isTasksPending])

    // use useMutation to delete an objective
    const deleleObjectiveMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: () => {
            refetchAfterObjectiveDeletion()
            // handleNotification("Objective deleted successfully", "success")
        }
    })
    //handle clicking delete-objective button
    const handleDeleteEntity = (e) => {
        e.stopPropagation()
        if (e.ctrlKey) {
            deleleObjectiveMutation.mutate({
            action: "delete",
            entityName: entityName,
            currentEntity: entity,
            handleNotification: handleNotification,
            handleLogout: handleLogout
        })

        } else {
            handleNotification(`Use 'CTRL + Click' to delete ${entityName} '${entity.title}' `, "failure")
        }
    }

    //handle refetch on task deletion
    const refetchAfterTaskDeletion = () => {
        refetchTasks()
        refetchObjectiveProgress()
        refetchAfterObjectiveDeletion()
    }

    //
    const divProgressOverlay = useRef(null)
    const divProgressCardTools = useRef(null)
    const [progressBarDivWidth, setProgressBarDivWidth] = useState(null)

    //Determines the width of the progress bar fill
    const getWidthOfProgressBarFill= () => {
        if (divProgressOverlay && divProgressCardTools){
            const overlayRect = divProgressOverlay.current.getBoundingClientRect()
            const toolRect = divProgressCardTools.current.getBoundingClientRect()
            const overlayWidth = overlayRect.width
            const toolWidth = toolRect.width
            setProgressBarDivWidth((overlayWidth-toolWidth)*progressPercentage/100)
        }
    }
    useEffect(() => {getWidthOfProgressBarFill()}, [progressBarDivWidth, progressPercentage])

    //Determines whether an entity card can expand to reveal its children (e.g., Projects expands to reveal objectives) 
    const handleCardExpansion = (e) => {
        e.stopPropagation()
        entityName!=="task"? setIsExpanded(!isExpanded): undefined
    }

    //Open an update-task form
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        setCurrentObjective(entity)
        setIsModalOpen(true)
    }

    //flip dropdown icon from downwards-facing to upwards-facing
    const toggleDropdownIcon = () => {
        return isExpanded? <i className="fa fa-caret-up" aria-hidden="true"></i> : <i className="fa fa-caret-down" aria-hidden="true"></i>
    }

    //handle clicking add-task button
    const handleClickAddBtn = (e) => {
        e.stopPropagation()
        setForm(`create-task`)
        setCurrentTask({... !!currentTask.id? defaultTask : currentTask, "objectiveId":entity.id}) // #1
        setFormProject(project)
        setFormObjective(entity)
        setIsModalOpen(true)
    }

    return (
        <div className={`progress-card-container  ${entityName}-card-container`}>
            <div className="progress-card-row">
                <div className={`mutate-entity add-${entityName}-entity`}>
                    <button onClick={handleClickAddBtn}> <i className="fa fa-plus" aria-hidden="true"></i> </button>
                </div>
                <div 
                    ref={divProgressOverlay} 
                    className={`progress-card-overlay ${entityName}-card-overlay`}
                    onClick={onClickEditBtn}
                >
                    <ObjectiveInfoCard objective={entity} translate="175% 0%" objectiveProject={project} progress={rawMetricValues(completedTaskMetric, totalTaskMetric)}/>
                    <div className="progress-bar">
                        <div className="progress-bar-fill" 
                            style={{"width":`${progressBarDivWidth}px`, "backgroundColor":generateProgressBarColour(progressPercentage)}}
                        >
                        </div>

                        <div className="progress-card-content">{entity.objectiveNumber + " " + entity.title}</div>
                    </div>

                    <div ref={divProgressCardTools} className="progress-card-tools" onClick={handleCardExpansion}>
                        <div className="progress-percentage"> {progressPercentage}%</div>
                        <button className="dropdown-btn"> {toggleDropdownIcon()} </button>
                    </div>

                </div>
                <div className={`mutate-entity add-${entityName}-entity`}>
                    <button onClick={handleDeleteEntity}> <i className="fa fa-times" aria-hidden="true"></i> </button>
                </div>
            </div>

            {isExpanded && !isTasksPending ? 
                tasks?.map((task) => 
                    <TaskProgressCard key={task.id} entity={task} entityName="task" project={project} objective={entity} refetchAfterTaskDeletion={refetchAfterTaskDeletion}/> 
                )
                : undefined}
        </div>

    )
}   

/*notes;
    #1 Then the ternary statement saves the current task state for when you accidentally close the task form when adding a task, whilst not using the task state of recently edited task (which would have a task id). 

*/