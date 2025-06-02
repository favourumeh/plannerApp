import "./entityForm.css"
import {useState, useContext, useEffect} from "react"
import { useQuery, useMutation} from "@tanstack/react-query"
import globalContext from "../../context"
import SearchResult from "./searchResult"
import Dropdown from "../dropdown"
import {defaultTask} from "../../staticVariables"
import { readProjectsQueryOption, readTasksObjectiveAndProjectQueryOption, readProjectsObjectivesQueryOption} from "../../queryOptions"
import { mutateEntityRequest } from "../../fetch_entities"

function TaskForm ({form}) {
    if (!["create-task", "update-task"].includes(form)) {
        return null
    }
    const {
        currentTask, setCurrentTask, 
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        formProject, formObjective,
        formatDateFields,handleNotification, handleLogout, setIsModalOpen, setForm} = useContext(globalContext)

    const [projectQuery, setProjectQuery] = useState(formProject.title)
    const [objectiveQuery, setObjectiveQuery] = useState(formObjective.title)

    const getProjectsQuery = useQuery(
        readProjectsQueryOption(false, handleNotification, handleLogout)
    )
    const projects = getProjectsQuery.isPending? [] : getProjectsQuery.data.projects

    const {data: taskParentData, isPending: isPendingTasksParents} = useQuery({ //requests the projects and objectives of the task in the form.
        ...readTasksObjectiveAndProjectQueryOption(currentTask.id, handleNotification, handleLogout),
        enabled: !!currentTask.id, // only runs if the current task has an id field
    })

    const createOrEditTaskMutation = useMutation({ //defines the useMutationResult obj that is used to call the mutation function and onsuccess behaviour
        mutationFn: mutateEntityRequest,
        onSuccess: () => {
            setIsModalOpen(false)
            setForm("")
        }
    })

    const onSubmitForm = (e) => {// call mutate function to create/update a task
        e.preventDefault()
        createOrEditTaskMutation.mutate({
            action: form.split("-")[0], 
            entityName: "task", 
            currentEntity: currentTask, 
            handleNotification: handleNotification, 
            handleLogout: handleLogout
        })
    }

    useEffect(() => { // sets intial content of the project/objective fields of an update-task form to the project/objective titles of task being updated
        if (!isPendingTasksParents && !!currentTask.id) {
            setProjectQuery(taskParentData.project.title)
            setObjectiveQuery(taskParentData.objective.title)
        } 
    }, [isPendingTasksParents]);

    const projectTitles = projects.map(project=>project.title)
    const taskProject = projectTitles.includes(projectQuery)? projects.find(project=> project.title==projectQuery) : {}

    const {data: objectivesData , isPending: isPendingObjectives } = useQuery({ // requests the objectives of the project in the form's project field
        ...readProjectsObjectivesQueryOption(taskProject.id, handleNotification, handleLogout),
        enabled: !!taskProject.id
    })
    const relevantObjectives = isPendingObjectives? [{}] : objectivesData.objectives
    const objectiveTitles = relevantObjectives.map(objective=> objective?.title)
    const taskObjective = objectiveTitles.includes(objectiveQuery)?
        relevantObjectives.find(objective => (objective.title == objectiveQuery) && (objective.projectId == taskProject.id) ) : {}

    useEffect( () => { //clear objective if the project field is not valid (given that the projects have been )
        if (!getProjectsQuery.isPending && !projectTitles.includes(projectQuery)) {
            setObjectiveQuery("")
        }}, [projectQuery])

    useEffect(() => {
        if (!isPendingObjectives) {
            // console.log("Objective query", objectiveQuery, "objectiveTitles", objectiveTitles) 
            if  (objectiveTitles.includes(objectiveQuery)) {
                setCurrentTask({...currentTask, "objectiveId":taskObjective?.id}) // set the objectiveId field of the currentTask when a valid objective is clicked or typed in the form's objective field
            } else {
                setCurrentTask({...currentTask, "objectiveId":""}) // set the objectiveId field of the currentTask to empty string when an invalid objective is typed in the form's objective field
            }
        }
    }, [objectiveQuery, relevantObjectives])

    useEffect(() => {// generate duration of a task when start and finish dates are present and updated
        if (!!currentTask.start && !!currentTask.finish){
            const durationAccMs = new Date (currentTask.finish).getTime() - new Date(currentTask.start).getTime()
            const durationAccMin = Math.round(durationAccMs/(60*1000))
            setCurrentTask({...currentTask, "duration":durationAccMin})
        }
    }, [currentTask.start, currentTask.finish])

    useEffect(()=> {setCurrentTask( prev => (formatDateFields(prev))) }, [] )

    const mandatoryIndicator = (fieldStateVar, indicator) => {
        return (typeof fieldStateVar==="undefined" || fieldStateVar==="")? <span className="required-asterisk">{indicator}</span>: undefined
    }

    const toggleShowSearchResult = (e, fieldLableName) => {
        e.stopPropagation()
        if (fieldLableName ==="Project"){
            setShowProjectQueryResult(!showProjectQueryResult)
            setShowObjectiveQueryResult(false)
        } else if (fieldLableName==="Objective") {
            setShowObjectiveQueryResult(!showObjectiveQueryResult)
            setShowProjectQueryResult(false)
        }
    }

    const closeSearchResult = () => {
        setShowProjectQueryResult(false)
        setShowObjectiveQueryResult(false)
    }
    const handleChange = (e) => {
        const {name, value} = e.target
        setCurrentTask(prev => ({...prev, [name]:value}))
    }
    
    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentTask, mandatoryField} = params
        const displayDurationAcc = inputName!=="durationEst"?  undefined : !!currentTask.duration ? `(Acc=${currentTask.duration})`: undefined
        return (
            <div  className="form-group">
                <div className="field-title"> {labelName} {displayDurationAcc} {mandatoryField? mandatoryIndicator(currentTask[inputName], "*"):undefined}</div>
                <input 
                    type = {inputType}
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {currentTask[inputName]}
                    onChange = {handleChange}
                    min={inputName === "durationEst" ? "10" : 1}
                    max={labelName === "Priority"? 5: undefined}
                    step={inputName === "durationEst" ? "10": undefined} 
                    autoComplete="off"
                />
            </div>
        )
    }

    const formSearchField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, queryField, setQueryField, entityArray} = params
        return (
            <div id={`${labelName}-field`} className="form-group">
                <div className="field-title"> {labelName}{mandatoryIndicator(queryField,"*")} </div>
                <input 
                    style = {{"color": labelName =="Project"? (projectTitles.includes(queryField)? "green":"red"): (objectiveTitles.includes(queryField)? "green":"red") }}
                    type = "text"
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {(isPendingTasksParents && form==="update-task")? "...": queryField}
                    autoComplete="off"
                    onChange = {e => setQueryField(e.target.value)}
                    onClick = {(e) => toggleShowSearchResult(e, labelName)}/>
                <SearchResult searchFieldLabel={labelName} query={queryField} setQuery={setQueryField} entityArray={entityArray}/>
            </div>
        )
    }
    
    //clearing all fields of a the form
    const handleClearAll = (excludeEntityFields) => {
        excludeEntityFields? undefined : setProjectQuery("")
        setCurrentTask({...defaultTask, id:currentTask.id, objectiveId:currentTask.objectiveId})
    }
    return (
        <>
        <div className="form-overlay" onClick={closeSearchResult}>
            <div className="form-header">
                <div className="form-title"> {form.split("-").join(" ").toUpperCase()}  {form==="create-task"? undefined :`#${currentTask.taskNumber} (${currentTask.id})`} </div>
            </div>

            <div className="form-body">
                <div id ="form-status-field" className="form-group">
                    <div className="field-title"> Status</div>
                    <Dropdown buttonContent={`${currentTask.status}`} translate={"0% 40%"}>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"To-Do"})}> To-Do</div>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"In-Progress"})}> In-Progress</div>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"Completed"})}> Completed</div>
                    </Dropdown>
                </div>

                <div className="form-group">
                    <div className="field-title"> Task Description{mandatoryIndicator(currentTask["description"], "*")} </div>
                    <textarea 
                        type = "description"
                        id = "description"
                        className={`form-input entity-description`}
                        name = "description" // used in the request made to the server
                        value = {currentTask["description"]}
                        onChange = {handleChange}
                        autoComplete = "off"
                        placeholder = "Task Description*"
                    />
                </div>

                <div className="other-entity-configs">
                    <div className="form-left-column">
                        {formSearchField({labelName:"Project", inputName:"project", queryField:projectQuery, setQueryField:setProjectQuery, entityArray:projects})}
                        {formField({labelName:"Scheduled Date", inputName:"scheduledStart", inputType:"date", currentTask:currentTask, mandatoryField:false})}
                        {formField({labelName:"Priority", inputName:"priorityScore", inputType:"number", currentTask:currentTask, mandatoryField:false})}
                        {formField({labelName:"Start", inputName:"start", inputType:"datetime-local", currentTask:currentTask, mandatoryField:false})}
                    </div>

                    <div className="form-right-column">
                        {formSearchField({labelName:"Objective", inputName:"objective", queryField:objectiveQuery, setQueryField:setObjectiveQuery, entityArray:relevantObjectives})}
                        {formField({labelName:"Duration Est", inputName:"durationEst", inputType:"number", currentTask:currentTask, mandatoryField:true})}
                        {/* {formField({labelName:"Duration (acc)", inputName:"duration", inputType:"number", currentTask:currentTask, mandatoryField:false})} */}
                        {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentTask:currentTask, mandatoryField:false})}
                        {formField({labelName:"Finish", inputName:"finish", inputType:"datetime-local", currentTask:currentTask, mandatoryField:false})}
                    </div>
                </div>
                <div className="form-buttons">
                    <Dropdown buttonContent={`Clear`} buttonClassName="form-clear-btn" translate={"-75% -10%"}>
                        <div onClick={()=> handleClearAll(false)}> All fields</div>
                        <div onClick={()=> handleClearAll(true)}> Excl. entity fields</div>
                    </Dropdown>

                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            // onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentTask)}
                            onClick={(e) => onSubmitForm(e)}
                            disabled ={
                                !taskProject.title 
                                || !taskObjective 
                                || !currentTask.description 
                                || !(currentTask.durationEst >=  10
                                || createOrEditTaskMutation.isPending
                                ) ? true:false}>
                            { createOrEditTaskMutation.isPending? "sending..." : form==="create-task"? "Create":"Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default TaskForm