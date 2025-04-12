import "./entityForm.css"
import {useContext, useEffect} from "react"
import globalContext from "../context"
import Dropdown from "./Dropdown"
function ProjectForm () {

    const {form, currentProject, setCurrentProject, handleEntitySubmit, formatDateFields} = useContext(globalContext)

    if (!["create-project", "update-project"].includes(form)) {
        return null
    }

    const mandatoryIndicator = (fieldStateVar, indicator) => {
        return (typeof fieldStateVar==="undefined" || fieldStateVar==="")? <span className="required-asterisk">{indicator}</span>: undefined
    }
    useEffect(() => {setCurrentProject(prev => (formatDateFields(prev)))}, []);

    const formField = (params) => {
        /*Returns the label and input tags of for a field in the content form*/
        const { labelName, inputName, inputType, currentProject, setCurrentProject, mandatoryField} = params
        return (
            <div className="form-group">
                <label htmlFor={inputName}> {labelName}{mandatoryField? mandatoryIndicator(currentProject[inputName], "*"):undefined}:</label>
                <input 
                    type = {inputType}
                    id = {inputName}
                    className="form-input"
                    name = {inputName} // used in the request made to the server
                    value = {currentProject[inputName]}
                    onChange = {e => setCurrentProject({...currentProject, [inputName]:e.target.value} )}
                    min={labelName=="Duration"?"10":"1"}
                    autoComplete="off"/>
            </div>
        )
    }

    return (
        <>
        <div className="form-overlay">
            <div className="form-header-overlay">
                <div className="form-title"> {form.split("-").join(" ").toUpperCase()} </div>
                <div className="form-header-buttons">
                    <Dropdown buttonContent={`Status: ${currentProject.status}`} translate={"0% 34%"}>
                        <div onClick={() => setCurrentProject({...currentProject, "status":"To-Do"})}> To-Do</div>
                        <div onClick={() => setCurrentProject({...currentProject, "status":"In-Progress"})}> In-Progress</div>
                        <div onClick={() => setCurrentProject({...currentProject, "status":"Paused"})}> Paused</div>
                        <div onClick={() => setCurrentProject({...currentProject, "status":"Completed"})}> Completed</div>
                    </Dropdown>
                </div>
            </div>

            <div className="form-body">
                <form className="form">
                    {formField({labelName:"Title", inputName:"title", inputType:"text", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:false})}
                    {formField({labelName:"Description", inputName:"description", inputType:"text", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:true})}
                    {formField({labelName:"Deadline", inputName:"deadline", inputType:"date", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:false})}
                    {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:false})}

                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={(e)=>handleEntitySubmit(e, form.split("-")[0], form.split("-")[1], currentProject)}
                            disabled ={!currentProject.description? true:false}>
                            {form == "create-project"? "Create":"Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}

export default ProjectForm