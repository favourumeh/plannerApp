import "./progressCard.css"
import { useState, useContext, useRef, useEffect} from "react"
import { useQuery, keepPreviousData, useMutation } from "@tanstack/react-query"
import globalContext from "../../context"
import ProjectInfoCard from "../InfoCards/projectInfoCard"
import ObjectiveProgressCard from "./objectiveProgressCard"
import { fetchEntityProgress, mutateEntityRequest } from "../../fetch_entities"
import { readProjectsObjectivesQueryOption } from "../../queryOptions"
import { generateProgressBarColour } from "../../utils/progressUtils"
import { defaultObjective } from "../../staticVariables"
import { formatTaskMins } from "../../utils/dateUtilis"

export default function ProjectProgressCard ({entity, entityName, metric, refetchProjects}) {
    // console.log("params", entityName, metric)
    const [isExpanded, setIsExpanded] = useState(false)
    const { currentObjective, setCurrentObjective, setCurrentProject, 
            setForm, setIsModalOpen, setFormProject, 
            handleNotification, handleLogout, isModalOpen } = useContext(globalContext)
    
    //useQuery to get the progress percentage of the project
    const {data: progressQuery, isPending: isProgressPending, refetch: refetchProjectProgress} = useQuery({
        queryKey: ["projectProgress", entity.id],
        queryFn: () => fetchEntityProgress({entityId: entity.id, entityName, handleNotification, handleLogout}),
        placeholderData: keepPreviousData,
        retry: 3,
    })

    //use useQuery to get the objectives of the project 
    const {data: objectivesQuery, isPending: isObjectivesPending, refetch: refetchProjectObjectives} = useQuery({
    ...readProjectsObjectivesQueryOption(entity.id, handleNotification, handleLogout),
       enabled: isExpanded,
    })
    const progressPercentage = !isProgressPending? metric==="duration"? Math.round(progressQuery.progressPercentageDuration) : Math.round(progressQuery.progressPercentageCount) : "..."
    const completedTaskMetric = !isProgressPending? metric==="duration"? formatTaskMins(progressQuery.completedTaskDuration) : progressQuery.completedTaskCount : "..."
    const totalTaskMetric = !isProgressPending? metric==="duration"? formatTaskMins(progressQuery.totalTaskDuration) : progressQuery.totalTaskCount : "..."

    const rawMetricValues = (completedTaskMetric, totalTaskMetric) => {
        return  `${completedTaskMetric}/${totalTaskMetric}${metric==="duration"? "" : " tasks"}`
    }

    const objectives = isExpanded && !isObjectivesPending? objectivesQuery.objectives : [] 

    // refresh the progress percentage and the objectives when the project is updated 
    const refetchProjectQueries = () => {
        refetchProjectProgress()
        refetchProjectObjectives()
    }

    useEffect(() => {
        if (!isModalOpen && !isProgressPending && !isObjectivesPending) {
            refetchProjectQueries()
        }
    }, [isModalOpen, isProgressPending, isObjectivesPending])


    // use useMutation to delete a project
    const deleleProjectMutation = useMutation({
        mutationFn: mutateEntityRequest,
        onSuccess: () => {
            refetchProjects()
            // handleNotification("Project deleted successfully", "success")
        }
    })

    //handle clicking delete-project button
    const handleDeleteEntity = (e) => {
        e.stopPropagation()
        if (e.ctrlKey) {
            deleleProjectMutation.mutate({
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

    // handle refetch after objective deltion 
    const refetchAfterObjectiveDeletion = () => {
        refetchProjectObjectives()
        refetchProjectProgress()
    }

    //calculate the progress percentage 
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

    //Open an edit entity form
    const onClickEditBtn = (e) => {
        e.stopPropagation()
        setForm(`update-${entityName}`)
        setCurrentProject(entity)
        setIsModalOpen(true)
    }

    //flip dropdown icon from downwards-facing to upwards-facing
    const toggleDropdownIcon = () => {
        return isExpanded? <i className="fa fa-caret-up" aria-hidden="true"></i> : <i className="fa fa-caret-down" aria-hidden="true"></i>
    }

    //handle clicking add-entity button
    const handleClickAddBtn = (e) => {
        e.stopPropagation()
        setCurrentObjective({... !!currentObjective.id? defaultObjective : currentObjective, "projectId":entity.id}) 
        setFormProject(entity)
        setForm(`create-objective`)
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
                    <ProjectInfoCard project={entity} translate="195% 0%" progress={rawMetricValues(completedTaskMetric, totalTaskMetric)} />
                    <div className="progress-bar">
                        <div className="progress-bar-fill" 
                            style={{"width":`${progressBarDivWidth}px`, "backgroundColor":generateProgressBarColour(progressPercentage)}}
                        >
                        </div>

                        <div className="progress-card-content">{`${entity.projectNumber} ${entity.title}`}</div>
                    </div>

                    <div ref={divProgressCardTools} className="progress-card-tools" onClick={handleCardExpansion}>
                        <div className="progress-percentage"> {progressPercentage}%</div>
                        <button className="dropdown-btn"> {toggleDropdownIcon()} </button>
                    </div>

                </div>
                <div className={`mutate-entity delete-${entityName}-entity`}>
                    <button onClick={handleDeleteEntity}> <i className="fa fa-times" aria-hidden="true"></i> </button>
                </div>
            </div>

            {isExpanded && !isObjectivesPending? 
                objectives?.map((objective) => 
                    <ObjectiveProgressCard 
                        key={objective.id} 
                        entity={objective} 
                        entityName="objective" 
                        project={entity} 
                        metric={metric} 
                        refetchAfterObjectiveDeletion={refetchAfterObjectiveDeletion}/>
                )
                : undefined}
        </div>

    )
}
