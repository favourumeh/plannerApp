import "./entityForm.css"
import {useState, useContext, useEffect, useRef} from "react"
import globalContext from "../../context"
import SearchResult from "./searchResult"
import Dropdown from "../dropdown"
import { defaultObjective } from "../../staticVariables"

function ObjectiveForm () {
    const {
        form, currentObjective, setCurrentObjective, 
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        formProject, projects, handleEntitySubmit, formatDateFields} = useContext(globalContext)

    if (!["create-objective", "update-objective"].includes(form)) {
        return null
    }

    const findTaskProject = (objective) => projects.find( (project)=> project.id===objective.projectId) || {"title":""}

    const projectTitles = useRef(projects.map(project=>project.title))
    const [taskProject, setTaskProject] = useState(form=="create-task"? formProject:findTaskProject(currentObjective))
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

    useEffect(() => setCurrentObjective(formatDateFields(currentObjective)),[])

    const handleChange = (e) => {
        const {name, value} = e.target
        setCurrentObjective(prev => ({...prev, [name]:value}))
    }

    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentObjective, mandatoryField} = params
        return (
            <div className="form-group">
                <div className="field-title"> {labelName}{mandatoryField? mandatoryIndicator(currentObjective[inputName], "*"):undefined}:</div>
                <input 
                    type = {inputType}
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {currentObjective[inputName]}
                    onChange = {handleChange}
                    autoComplete="off"/>
            </div>
        )
    }

    const formSearchField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, queryField, setQueryField, entityArray} = params
        return (
            <div id={`${labelName}-field`} className="form-group">
                <div className="field-title"> {labelName}{mandatoryIndicator(queryField,"*")}:</div>
                <input 
                    style = {{"color": (projectTitles.current.includes(queryField)? "green":"red")}}
                    type = "text"
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {queryField}
                    autoComplete="off"
                    onChange = {(e) => setQueryField(e.target.value)}
                    onClick = {(e) => toggleShowSearchResult(e, labelName)}/>
                <SearchResult searchFieldLabel={labelName} query={queryField} setQuery={setQueryField} entityArray={entityArray}/>
            </div>
        )
    }

    const formTextAreaFields = (params) => {
        const { labelName, inputName, currentObjective, mandatoryField } = params

        return (
            <div className="form-group">
            <div className="field-title"> Objective {labelName}{mandatoryField? mandatoryIndicator(currentObjective[inputName], "*"): undefined} </div>
                <textarea 
                    id = {inputName}
                    className={`form-input entity-${inputName}`}
                    name = {inputName} // used in the request made to the server
                    value = {currentObjective[inputName]}
                    onChange = {handleChange}
                    autoComplete = "off"
                    placeholder = {`Objective ${labelName}*`}
                />
            </div>
        )
    } 

     //clearing all fields of a the form
     const handleClearAll = (excludeEntityFields) => {
         excludeEntityFields? undefined : setProjectQuery("")
         setCurrentObjective({
            ...defaultObjective, 
            id:currentObjective.id, 
            projectId:currentObjective.projectId
        })
     }

    return (
        <>
        <div id="objective-form-overlay" className="form-overlay" onClick={closeSearchResult}>
            <div className="form-header-overlay">
                <div className="form-title"> {form.split("-").join(" ").toUpperCase()} ({currentObjective.id}) </div>
            </div>

            <div className="form-body">
                {formTextAreaFields({labelName:"Title", inputName:"title", currentObjective:currentObjective, mandatoryField:true})}
                {formTextAreaFields({labelName:"Description", inputName:"description", currentObjective:currentObjective, mandatoryField:true})}
                <div id ="form-status-field" className="form-group">
                    <div className="field-title"> Status</div>
                    <Dropdown buttonContent={`${currentObjective.status}`} translate={"0% 40%"}>
                        <div onClick={() => setCurrentObjective({...currentObjective, "status":"To-Do"})}> To-Do</div>
                        <div onClick={() => setCurrentObjective({...currentObjective, "status":"In-Progress"})}> In-Progress</div>
                        <div onClick={() => setCurrentObjective({...currentObjective, "status":"Completed"})}> Completed</div>
                    </Dropdown>
                </div>
                <div className="other-entity-configs">
                    <div className="form-left-column">
                        {formSearchField({labelName:"Project", inputName:"project", queryField:projectQuery, setQueryField:setProjectQuery, entityArray:projects})}
                        {formField({labelName:"Deadline", inputName:"deadline", inputType:"date", currentObjective:currentObjective, mandatoryField:false})}
                    </div>

                    <div className="form-right-column">
                        {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentObjective:currentObjective, mandatoryField:false})}
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
                            onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentObjective)} 
                            disabled ={!taskProject.title || !currentObjective.description ? true:false}>
                            {form == "create-objective"? "Create":"Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default ObjectiveForm
