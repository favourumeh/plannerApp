import "./taskForm.css"
import { backendBaseUrl} from "../project_config"
import {useContext} from "react"
import globalContext from "../context"

function ProjectForm () {

    const {
        setIsModalOpen, clientAction, handleNotification, 
        currentProject, setCurrentProject, handleRefresh,
        handleLogout} = useContext(globalContext)

    if (!["create-project", "edit-project"].includes(clientAction)) {
        return null
    }

    const onSubmit = async(e) =>{
        e.preventDefault()
        const url = `${backendBaseUrl}/${clientAction=="create-project"? "create-project": "update-project/"+currentProject.id}`
        const options = {
            method:clientAction=="create-project"? "POST":"PATCH",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(currentProject),
            credentials:"include"
        }
        const resp = await fetch(url, options)
        const resp_json = await resp.json()

        if ([200, 201].includes(resp.status)){
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
            setIsModalOpen(false)
            setCurrentProject({})
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
                <div className="form-title"> {clientAction.split("-").join(" ").toUpperCase()} </div>
                <div className="form-header-buttons">
                    <button 
                        style={{"color":currentProject.isCompleted?"rgb(0, 128, 0)":"rgb(255, 0, 0)"}} 
                        onClick={() => setCurrentProject({...currentProject, isCompleted:!currentProject.isCompleted})}>Completed?</button>
                </div>
            </div>

            <div className="form-body">
                <form className="form">
                    {formField({labelName:"Title", inputName:"title", inputType:"text", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:false})}
                    {formField({labelName:"Description", inputName:"description", inputType:"text", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:true})}
                    {formField({labelName:"Deadline", inputName:"deadline", inputType:"datetime-local", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:false})}
                    {formField({labelName:"Tag", inputName:"tag", inputType:"text", currentProject:currentProject, setCurrentProject:setCurrentProject, mandatoryField:false})}

                    <div className="btn-div">
                        <button type="submit" 
                            className="submit-btn" 
                            onClick={(e)=>onSubmit(e)}
                            disabled ={!currentProject.description? true:false}>
                            {clientAction == "create-project"? "Create":"Update"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}

export default ProjectForm