import "./entityForm.css"
import {useState, useContext, useEffect, useRef} from "react"
import globalContext from "../context"
import SearchResult from "./searchResult"
import Dropdown from "./Dropdown"

function TaskForm () {
    const {
        form, currentTask, setCurrentTask, 
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        defaultProject, defaultProjectObjective,
        projects, objectives, handleEntitySubmit, formatDateFields} = useContext(globalContext)

    if (!["create-task", "update-task"].includes(form)) {
        return null
    }

    const findTaskObjective = () => objectives.find( (objective)=> objective.id===currentTask.objectiveId )  || {"title":""}
    const findTaskProject = (objective) => projects.find( (project)=> project.id===objective.projectId) || {"title":""}

    const projectTitles = useRef(projects.map(project=>project.title))
    const [taskProject, setTaskProject] = useState(form=="create-task"? defaultProject:findTaskProject(findTaskObjective()))
    const [taskObjective, setTaskObjective] = useState(form=="create-task"? defaultProjectObjective:findTaskObjective())

    const [projectQuery, setProjectQuery] = useState(taskProject.title)
    const [relevantObjectives, setRelevantObjetives] = useState(objectives.filter(objective=> objective.projectId == taskProject.id))
    const [objectiveQuery, setObjectiveQuery] = useState(taskObjective.title)
    const [objectiveTitles, setObjectiveTitles] = useState(relevantObjectives.map(objective=> objective.title))
    
    // add console prints here (see #1)

    //#region: search field useEffect updates
    useEffect( () => projectTitles.current.includes(projectQuery)?
            setTaskProject(projects.find(project=> project.title==projectQuery)):
            setTaskProject({}), 
    [projectQuery])

    useEffect( () => {
        setRelevantObjetives(objectives.filter(objective=> objective.projectId == taskProject.id))
        if (!projectTitles.current.includes(projectQuery)) {
            setObjectiveQuery("")
        }}, [taskProject])

    useEffect(() => setObjectiveTitles(relevantObjectives.map(objective=> objective.title)), [relevantObjectives])

    useEffect(() => objectiveTitles.includes(objectiveQuery)?
            setTaskObjective(objectives.find(objective=> objective.title == objectiveQuery)):
            setTaskObjective({}), 
    [objectiveQuery])

    useEffect(() => objectiveTitles.includes(objectiveQuery)? 
        setCurrentTask({...currentTask, "objectiveId":taskObjective.id}) : 
        setCurrentTask({...currentTask, "objectiveId":""})
    , [taskObjective])
    //#endregion

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

    useEffect(() => {setCurrentTask(prev => (formatDateFields(prev))) }, []);

    useEffect(() => {
        if (currentTask["duration"] && currentTask["start"]){
            const duration = parseInt(currentTask["duration"])
            let start = new Date(currentTask["start"])
            const timezoneOffset = new Date().getTimezoneOffset() * 60000;
            const finish = new Date(start.getTime() + duration * 60000 - timezoneOffset) 
            setCurrentTask((prev) => ({...prev, "finish":finish.toISOString().replace(/:\d{2}\.\d{3}Z$/, '')}))
        }
    },[currentTask["duration"], currentTask["start"]])

    useEffect(() => {
        const scheduledStart = new Date(currentTask.scheduledStart).toISOString().split("T")[0]
        setCurrentTask({...currentTask, "scheduledStart":scheduledStart})}, [])

    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentTask, setCurrentTask, mandatoryField} = params
        return (
            <div className="form-group">
                <label htmlFor={inputName}> {labelName}{mandatoryField? mandatoryIndicator(currentTask[inputName], "*"):undefined}:</label>
                <input 
                    type = {inputType}
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {currentTask[inputName]}
                    onChange = {(e) => setCurrentTask({...currentTask, [inputName]:e.target.value})}
                    min={labelName=="Duration"?"10":"1"}
                    step={labelName==="Duration"?"10": undefined} 
                    autoComplete="off"/>
            </div>
        )
    }

    const formSearchField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, queryField, setQueryField, entityArray} = params
        return (
            <div className="form-group">
                <label htmlFor={inputName}> {labelName}{mandatoryIndicator(queryField,"*")}:</label>
                <input 
                    style = {{"color": labelName =="Project"? (projectTitles.current.includes(queryField)? "green":"red"): (objectiveTitles.includes(queryField)? "green":"red") }}
                    type = "text"
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {queryField}
                    autoComplete="off"
                    onChange = {e => setQueryField(e.target.value)}
                    onClick = {(e) => toggleShowSearchResult(e, labelName)}/>
                <SearchResult searchFieldLabel={labelName} query={queryField} setQuery={setQueryField} entityArray={entityArray}/>
            </div>
        )
    }

    return (
        <>
        <div className="form-overlay" onClick={closeSearchResult}>
            <div className="form-header-overlay">
                <div className="form-title"> {form.split("-").join(" ").toUpperCase()} </div>
                <div className="form-header-buttons">
                    <Dropdown buttonContent={`Status: ${currentTask.status}`} translate={"0% 34%"}>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"To-Do"})}> To-Do</div>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"In-Progress"})}> In-Progress</div>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"Paused"})}> Paused</div>
                        <div onClick={() => setCurrentTask({...currentTask, "status":"Completed"})}> Completed</div>
                    </Dropdown>
                    <button
                        style={{"color":currentTask.isRecurring?"rgb(0, 128, 0)":"rgb(255, 0, 0)"}} 
                        onClick={() => setCurrentTask({...currentTask, isRecurring:!currentTask.isRecurring})}>
                        Recurring?
                    </button>

                </div>
            </div>

            <div className="form-body">
                <form className="form">
                    {formSearchField({labelName:"Project", inputName:"project", queryField:projectQuery, setQueryField:setProjectQuery, entityArray:projects})}
                    {formSearchField({labelName:"Objective", inputName:"objective", queryField:objectiveQuery, setQueryField:setObjectiveQuery, entityArray:relevantObjectives})}
                    {formField({labelName:"Description", inputName:"description", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:true})}
                    {formField({labelName:"Duration", inputName:"duration", inputType:"number", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:true})}
                    {formField({labelName:"Priority", inputName:"priorityScore", inputType:"number", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Start", inputName:"start", inputType:"datetime-local", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Finish", inputName:"finish", inputType:"datetime-local", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Scheduled Date", inputName:"scheduledStart", inputType:"date", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentTask)}
                            disabled ={!taskProject.title || !taskObjective || !currentTask.description || !(currentTask.duration >=  10) ? true:false}>
                            {form == "create-task"? "Create":"Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}

export default TaskForm



// Notes

    /*
        #1:prev enfornces the use of previous currentTask state. (without this the currentTask state will be the initial state)
        #2: the use of the for loop to update currentTask is only possible because of the use of (prev) => ({...prev }) to update the state of currentTask in formatDateTime.
            prev => ({ ...prev }) ensures each update uses the latest state, even if other updates are pending. Without this, all updates in the loop reference the same initial state, leading to overwrites.
    */