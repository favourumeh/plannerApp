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

    const [ projectQuery, setProjectQuery ] = useState(formProject.title)
    const [ objectiveQuery, setObjectiveQuery ] = useState(formObjective.title)
    const [ formInputIssues, setFormInputIssues ] = useState("")
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
    const relevantObjectives = (isPendingObjectives || !taskProject.id)? [{}] : objectivesData.objectives //woo bug fix
    const objectiveTitles = relevantObjectives.map(objective=> objective?.title)
    const taskObjective = objectiveTitles.includes(objectiveQuery)?
        relevantObjectives.find(objective => (objective.title == objectiveQuery) && (objective.projectId == taskProject.id) ) : {}

    useEffect(() => { //get the objective Id that belongs to the project when the objective query matches the projects objective
        if (!isPendingObjectives && !!objectiveQuery) {
            // console.log("Objective query", objectiveQuery, "objectiveTitles", objectiveTitles) 
            // console.log("relevantObjectives", relevantObjectives)
            // console.log("woo")
            if  (objectiveTitles.includes(objectiveQuery)) {
                setCurrentTask({...currentTask, "objectiveId":taskObjective?.id}) // set the objectiveId field of the currentTask when a valid objective is clicked or typed in the form's objective field
            } else {
                // console.log("woo")
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

    useEffect(()=> {setCurrentTask( (formatDateFields(currentTask)) ) }, [] )

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

    useEffect(() => {
        if ( currentTask.status !== "Completed") {
            setCurrentTask(prev => ({...prev, "finish":"", duration:null}))
        }
    }, [currentTask.status])

    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentTask, mandatoryField} = params
        const displayDurationAcc = inputName !== "durationEst" ? undefined : Number.isInteger(currentTask.duration) ? `(Acc=${currentTask.duration})` : undefined
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

    const handleSearchFieldChange =  async (e) => {
        const {name, value} = e.target
        if (name==="project"){
            setProjectQuery(value)
            if  (!getProjectsQuery.isPending && !projectTitles.includes(value)) {
                setObjectiveQuery("")
            }
        }
        if (name==="objective") {
            if (!projectTitles.includes(projectQuery)){ // stops user from editing the Objective field when the project field is not valid. This causes endless run or the useEffect with relevantObjectives dependecy because relevant objective is [{}]
                setObjectiveQuery("")
                return
            }
            setObjectiveQuery(value)
        }
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
                    onChange = {handleSearchFieldChange}
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

    // Handle Form Input Validation
    const handleDisableFormSubmitBtn = () =>{ //disables the submit button when the form's input is invalid OR if form is waiting on the response from POST/PATCH request. 
        var disabled = false
        if ( !taskProject?.title || !taskObjective?.title ) {
            disabled = true
        }
        if ( !currentTask.description ) {
            disabled = true
        }
        if ( !(currentTask.durationEst >=  10 ) ) {
            disabled=true
        }
        if ( Number.isInteger(currentTask.duration) &&  currentTask.duration <= 0 ) {
            disabled=true
        }
        if ( !!currentTask.finish && currentTask.status!=="Completed" ) {
            disabled=true
        }
        if ( (!currentTask.finish || !currentTask.start) && currentTask.status==="Completed" ) {
            disabled=true
        }
        if ( currentTask.description.length > 200 ) {disabled=true}
        if ( createOrEditTaskMutation.isPending ) {disabled=true} // when waiting for the post/patch request to complete. the submit button must be disabled
        return disabled
    }

    useEffect( ()=> { //specifies what form validation error messages to show/remove

        const message1 = " Task is missing one of 'Project' or 'Objective' field."
        if (!!taskProject && !!taskObjective) {
            ( !currentTask.objectiveId ||  !taskProject.title || !taskObjective.title ) ?
                setFormInputIssues(prev => prev.includes(message1) ? prev : prev +message1)
                : setFormInputIssues(prev => prev.replace(message1, ""))
        } else {
            setFormInputIssues(prev => prev.includes(message1) ? prev : prev + message1)
        }

        const message2 = " Task is missing a description."
        if ( !currentTask.description ) {
            setFormInputIssues(prev => prev.includes(message2) ? prev : prev + message2)
        } else {
            setFormInputIssues(prev => prev.replace(message2, ""))
        }

        const message3 = " Task's duration estimate is below 10min."
        if ( !(currentTask.durationEst >=  10 ) ) {
            setFormInputIssues(prev => prev.includes(message3) ? prev : prev + message3)
        } else {
            setFormInputIssues(prev => prev.replace(message3, ""))
        }

        const message4 = " Task duration is a number below 0 or equal to 0."
        if ( Number.isInteger(currentTask.duration) &&  currentTask.duration <= 0 ) {
            setFormInputIssues(prev => prev.includes(message4) ? prev : prev + message4)
        } else {
            setFormInputIssues(prev => prev.replace(message4, ""))
        }

        const message5 = " Task's 'Finish' field is filled in and its status is not 'Completed'."
        if ( !!currentTask.finish && currentTask.status!=="Completed" ) {
            setFormInputIssues(prev => prev.includes(message5) ? prev : prev + message5)
        } else {
            setFormInputIssues(prev => prev.replace(message5, ""))
        }

        const message6 = " Task's status is 'Completed' without filling in both the 'Finish' or 'Start' field"
        if ( (!currentTask.finish || !currentTask.start) && currentTask.status==="Completed" ) {
            setFormInputIssues(prev => prev.includes(message6) ? prev : prev + message6)
        } else {
            setFormInputIssues(prev => prev.replace(message6, ""))
        }

        const message7 = " Task's description is over 200 characters."
        if ( currentTask.description.length > 200 ) {
            setFormInputIssues(prev => prev.includes(message7) ? prev : prev + message7)
        } else {
            setFormInputIssues(prev => prev.replace(message7, ""))
        }
    }, [currentTask, projectQuery, objectiveQuery] )

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
                    <div className="field-title"> 
                        Task Description{mandatoryIndicator(currentTask["description"], "*")} &nbsp;
                        (<span style={{color: currentTask.description.length >200 ? "red": "white" }}>{currentTask.description.length || 0}</span>/200)
                    </div>
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
                    <div className="form-input-warning">
                        {formInputIssues}
                    </div>
                    <Dropdown buttonContent={`Clear`} buttonClassName="form-clear-btn" translate={"-75% -10%"}>
                        <div onClick={()=> handleClearAll(false)}> All fields</div>
                        <div onClick={()=> handleClearAll(true)}> Excl. entity fields</div>
                    </Dropdown>

                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={onSubmitForm}
                            disabled ={handleDisableFormSubmitBtn()}>
                            { createOrEditTaskMutation.isPending? "sending..." : form==="create-task"? "Create":"Update" }
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default TaskForm