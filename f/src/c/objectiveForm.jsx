import "./entityForm.css"
import {useState, useContext, useEffect, useRef} from "react"
import globalContext from "../context"
import SearchResult from "./searchResult"
import Dropdown from "./Dropdown"

function ObjectiveForm () {
    const {
        form, currentObjective, setCurrentObjective, 
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        defaultProject, projects, handleEntitySubmit} = useContext(globalContext)

    if (!["create-objective", "update-objective"].includes(form)) {
        return null
    }

    const findTaskProject = (objective) => projects.find( (project)=> project.id===objective.projectId) || {"title":""}

    const projectTitles = useRef(projects.map(project=>project.title))
    const [taskProject, setTaskProject] = useState(form=="create-task"? defaultProject:findTaskProject(currentObjective))
    const [projectQuery, setProjectQuery] = useState(taskProject.title)
    
    //#region: search field useEffect updates
    useEffect( () => projectTitles.current.includes(projectQuery)?
            setTaskProject(projects.find(project=> project.title==projectQuery)):
            setTaskProject({}), 
    [projectQuery])

    useEffect(() => projectTitles.current.includes(projectQuery)? 
        setCurrentObjective({...currentObjective, "projectId":taskProject.id}) : 
        setCurrentObjective({...currentObjective, "projectId":""})
    , [taskProject])
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

    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentObjective, setCurrentObjective, mandatoryField} = params
        return (
            <div className="form-group">
                <label htmlFor={inputName}> {labelName}{mandatoryField? mandatoryIndicator(currentObjective[inputName], "*"):undefined}:</label>
                <input 
                    type = {inputType}
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {currentObjective[inputName]}
                    onChange = {e => setCurrentObjective({...currentObjective, [inputName]:e.target.value} )}
                    min={labelName=="Duration"?"10":"1"}
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
                    style = {{"color": (projectTitles.current.includes(queryField)? "green":"red")}}
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
                <Dropdown buttonContent={`Status: ${currentObjective.status}`} translate={"0% 34%"}>
                    <div onClick={() => setCurrentObjective({...currentObjective, "status":"To Do"})}> To Do</div>
                    <div onClick={() => setCurrentObjective({...currentObjective, "status":"In Progress"})}> In Progress</div>
                    <div onClick={() => setCurrentObjective({...currentObjective, "status":"Paused"})}> Paused</div>
                    <div onClick={() => setCurrentObjective({...currentObjective, "status":"Completed"})}> Completed</div>
                </Dropdown>
                </div>
            </div>

            <div className="form-body">
                <form className="form">
                    {formSearchField({labelName:"Project", inputName:"project", queryField:projectQuery, setQueryField:setProjectQuery, entityArray:projects})}
                    {formField({labelName:"Title", inputName:"title", inputType:"text", currentObjective:currentObjective, setCurrentObjective:setCurrentObjective, mandatoryField:true})}
                    {formField({labelName:"Description", inputName:"description", inputType:"text", currentObjective:currentObjective, setCurrentObjective:setCurrentObjective, mandatoryField:true})}
                    {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentObjective:currentObjective, setCurrentObjective:setCurrentObjective, mandatoryField:false})}

                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentObjective)} 
                            disabled ={!taskProject.title || !currentObjective.description ? true:false}>
                            {form == "create-objective"? "Create":"Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}

export default ObjectiveForm
