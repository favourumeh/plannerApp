import "./entityForm.css"
import { backendBaseUrl} from "../project_config"
import {useState, useContext, useEffect, useRef} from "react"
import globalContext from "../context"
import SearchResult from "./searchResult"

function TaskForm () {
    const {
        setIsModalOpen, sitePage, form, setSitePage, handleNotification, 
        currentTask, setCurrentTask, handleRefresh,
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        defaultProject, defaultProjectObjective,
        projects, objectives, handleLogout} = useContext(globalContext)

    if (!["create-task", "edit-task"].includes(form)) {
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


    const onSubmit = async(e) =>{
        e.preventDefault()
        const url = `${backendBaseUrl}/${form=="create-task"? "create-task": "update-task/"+currentTask.id}`
        const options = {
            method:form=="create-task"? "POST":"PATCH",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(currentTask),
            credentials:"include"
        }
        const resp = await fetch(url, options)
        const resp_json = await resp.json()

        if ([200, 201].includes(resp.status)){
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
            setIsModalOpen(false)
            setSitePage("view-homepage")
            handleRefresh()
        } else {
            console.log(resp_json.message)
            const resp_ref = await fetch(`${backendBaseUrl}/refresh`, {"credentials":"include"})
            const resp_ref_json = await resp_ref.json()
            if (resp_ref.status !=200) {
                console.log(resp_ref_json.message)
                handleLogout()
                handleNotification(resp_ref_json.message, "failure")
            } else {
                console.log(resp_ref_json.message)
                onSubmit(e)
            }
        }
    }

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
                    onChange = {e => setCurrentTask({...currentTask, [inputName]:e.target.value} )}
                    min={labelName=="Duration"?"10":"1"}
                    autoComplete="off"/>
            </div>
        )
    }

    const formSearchField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, queryField, setQueryField, entityArray, toggleResultOverlay} = params
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
                    <button 
                        style={{"color":currentTask.isCompleted?"rgb(0, 128, 0)":"rgb(255, 0, 0)"}} 
                        onClick={() => setCurrentTask({...currentTask, isCompleted:!currentTask.isCompleted})}>Completed?</button>
                    <button
                        style={{"color":currentTask.isRecurring?"rgb(0, 128, 0)":"rgb(255, 0, 0)"}} 
                        onClick={() => setCurrentTask({...currentTask, isRecurring:!currentTask.isRecurring})}
                    >Recurring?</button>
                </div>
            </div>

            <div className="form-body">
                <form className="form">
                    {formSearchField({labelName:"Project", inputName:"project", queryField:projectQuery, setQueryField:setProjectQuery, entityArray:projects, })}
                    {formSearchField({labelName:"Objective", inputName:"objective", queryField:objectiveQuery, setQueryField:setObjectiveQuery, entityArray:relevantObjectives})}
                    {formField({labelName:"Description", inputName:"description", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:true})}
                    {formField({labelName:"Duration", inputName:"duration", inputType:"number", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:true})}
                    {formField({labelName:"Priority", inputName:"priorityScore", inputType:"number", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Start", inputName:"sheduledStart", inputType:"datetime-local", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Finish", inputName:"sheduledFinish", inputType:"datetime-local", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Previous Task", inputName:"previousTaskNumber", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Next Task", inputName:"nextTaskNumber", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Dependencies", inputName:"dependencies", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}
                    {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentTask:currentTask, setCurrentTask:setCurrentTask, mandatoryField:false})}

                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={(e)=>onSubmit(e)}
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

    //#1 : Console prints
    //#region : console prints
    // useEffect(() => {
    //     console.log("projectTitles", projectTitles)
    //     console.log("projectId", taskProject.id)
    //     }, [taskProject])

    // useEffect(() => {
    //     console.log("objective", objectives)
    //     console.log("relevantObjectives", relevantObjectives)
    //     }, [relevantObjectives])

    // useEffect(() => {console.log("objectiveTitles", objectiveTitles)}, [objectiveTitles])
    //#endregion