import "./entityForm.css"
import {useContext, useEffect} from "react"
import globalContext from "../../context"
import Dropdown from "../dropdown"
import { defaultProject } from "../../staticVariables"

function ProjectForm () {
    const {form, currentProject, setCurrentProject, handleEntitySubmit, formatDateFields} = useContext(globalContext)

    if (!["create-project", "update-project"].includes(form)) {
        return null
    }

    const mandatoryIndicator = (fieldStateVar, indicator) => {
        return (typeof fieldStateVar==="undefined" || fieldStateVar==="")? <span className="required-asterisk">{indicator}</span>: undefined
    }
    useEffect(() => {setCurrentProject(prev => (formatDateFields(prev)))}, []);

    const handleChange = (e) => {
        const {name, value} = e.target
        setCurrentProject(prev => ({...prev, [name]:value}))
    }

    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentProject, mandatoryField} = params
        return (
            <div className="form-group">
                <div htmlFor={inputName}> {labelName}{mandatoryField? mandatoryIndicator(currentProject[inputName], "*"):undefined}:</div>
                <input 
                    type = {inputType}
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {currentProject[inputName]}
                    onChange = {handleChange}
                    min={labelName=="Duration"?"10":"1"}
                    autoComplete="off"/>
            </div>
        )
    }

    const formTextAreaFields = (params) => {
        const { labelName, inputName, currentProject, mandatoryField } = params

        return (
            <div className="form-group">
            <div className="field-title"> Project {labelName}{mandatoryField? mandatoryIndicator(currentProject[inputName], "*"): undefined} </div>
                <textarea 
                    id = {inputName}
                    className={`form-input entity-${inputName}`}
                    name = {inputName} // used in the request made to the server
                    value = {currentProject[inputName]}
                    onChange = {handleChange}
                    autoComplete = "off"
                    placeholder = {`Project ${labelName}*`}
                />
            </div>
        )
    } 

     //clearing all fields of a the form
     const handleClearAll = () => {
        setCurrentProject({
           ...defaultProject, 
           id:currentProject.id, 
           userId:currentProject.userId
       })
    }
    return (
        <>
        <div className="form-overlay">
            <div className="form-header-overlay">
                <div className="form-title"> {form.split("-").join(" ").toUpperCase()} ({currentProject.id}) </div>
            </div>

            <div className="form-body">
                {formTextAreaFields({labelName:"Title", inputName:"title", currentProject:currentProject, mandatoryField:true})}
                {formTextAreaFields({labelName:"Description", inputName:"description", currentProject:currentProject, mandatoryField:true})}
                <div id ="form-status-field" className="form-group">
                    <div className="field-title"> Status</div>
                    <div className="form-header-buttons">
                        <Dropdown buttonContent={`Status: ${currentProject.status}`} translate={"0% 40%"}>
                            <div onClick={() => setCurrentProject({...currentProject, "status":"To-Do"})}> To-Do</div>
                            <div onClick={() => setCurrentProject({...currentProject, "status":"In-Progress"})}> In-Progress</div>
                            <div onClick={() => setCurrentProject({...currentProject, "status":"Completed"})}> Completed</div>
                        </Dropdown>
                    </div>
                </div>

                <div className="other-entity-configs">
                    <div className="form-left-column">
                        {formField({labelName:"Deadline", inputName:"deadline", inputType:"date", currentProject:currentProject, mandatoryField:false})}
                    </div>

                    <div className="form-right-column">
                        {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentProject:currentProject, mandatoryField:false})}
                    </div>
                </div>

                <div className="form-buttons">
                    <button onClick={() => handleClearAll()}> Clear</button>
                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentProject)}
                            disabled ={(!currentProject.description || !currentProject.title )? true:false}>
                            {form == "create-project"? "Create":"Update"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default ProjectForm