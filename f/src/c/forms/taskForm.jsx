import "./entityForm.css"
import {useState, useContext, useEffect, useRef} from "react"
import globalContext from "../../context"
import SearchResult from "./searchResult"
import Dropdown from "../dropdown"
import {defaultTask} from "../../staticVariables"

function TaskForm () {
    const {
        form, currentTask, setCurrentTask, 
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        formProject, formObjective,
        projects, objectives, handleEntitySubmit, formatDateFields} = useContext(globalContext)

    if (!["create-task", "update-task"].includes(form)) {
        return null
    }

    const findTaskObjective = () => objectives.find( (objective)=> objective.id===currentTask.objectiveId )  || {"title":""}
    const findTaskProject = (objective) => projects.find( (project)=> project.id===objective.projectId) || {"title":""}

    const projectTitles = useRef(projects.map(project=>project.title))
    const [taskProject, setTaskProject] = useState(form=="create-task"? formProject:findTaskProject(findTaskObjective()))
    const [taskObjective, setTaskObjective] = useState(form=="create-task"? formObjective:findTaskObjective())

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
                        setTaskObjective(objectives.find(objective => (objective.title == objectiveQuery) && (objective.projectId == taskProject.id) ))
                        :setTaskObjective({}), 
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

    useEffect(() => {
        if (!!currentTask.start && !!currentTask.finish){
            const durationAccMs = new Date (currentTask.finish).getTime() - new Date(currentTask.start).getTime()
            const durationAccMin = Math.round(durationAccMs/(60*1000))
            setCurrentTask({...currentTask, "duration":durationAccMin})
        }
        setCurrentTask( prev => (formatDateFields(prev)) )
    }, [])

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
    
    //clearing all fields of a the form
    const handleClearAll = (excludeEntityFields) => {
        excludeEntityFields? undefined : setProjectQuery("")
        setCurrentTask({...defaultTask, id:currentTask.id, objectiveId:currentTask.objectiveId})
    }

    return (
        <>
        <div className="form-overlay" onClick={closeSearchResult}>
            <div className="form-header">
                <div className="form-title"> {form.split("-").join(" ").toUpperCase()}  #{currentTask.id} </div>
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
                                onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentTask)}
                                disabled ={!taskProject.title || !taskObjective || !currentTask.description || !(currentTask.durationEst >=  10) ? true:false}>
                                {form == "create-task"? "Create":"Update"}
                            </button>
                        </div>
                    </div>
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