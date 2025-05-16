import "./entityForm.css"
import { useState, useContext, useEffect } from "react"
import { useQuery, useMutation} from "@tanstack/react-query"
import globalContext from "../../context"
import SearchResult from "./searchResult"
import Dropdown from "../dropdown"
import { defaultObjective } from "../../staticVariables"
import { readProjectsQueryOption } from "../../queryOptions"
import { mutateEntityRequest } from "../../fetch_entities"

function ObjectiveForm ({form}) {
    if (!["create-objective", "update-objective"].includes(form)) {
        return null
    }
    const {
        currentObjective, setCurrentObjective, 
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        formProject, formatDateFields,
        handleNotification, handleLogout, setIsModalOpen} = useContext(globalContext)

    const [projectQuery, setProjectQuery] = useState(formProject.title)

    //get user's projects 
    const getProjectsQuery = useQuery(readProjectsQueryOption(false, handleNotification, handleLogout))
    const projects = getProjectsQuery.isSuccess ? getProjectsQuery.data.projects : [{"title":""}]
    useEffect(() => { // sets initial content of the project field of an update-object form to the project/objective titles of objective being updated
        if (!getProjectsQuery.isPending && form==="update-objective") {
            const project = projects.find((project) => project.id === currentObjective.projectId )
            setProjectQuery(project.title)
        } 
    }, [getProjectsQuery.isPending]);

    const projectTitles = projects.map(project=>project.title)
    const taskProject= projectTitles.includes(projectQuery)? projects.find(project=> project.title==projectQuery) : {}
    
    //Change the projectId field of the currentObjective obj when value in the project field exactly matches a project in the db. 
    useEffect(() => projectTitles.includes(projectQuery)? 
        setCurrentObjective({...currentObjective, "projectId":taskProject.id})
        : setCurrentObjective({...currentObjective, "projectId":""})
    , [projectQuery, getProjectsQuery.isPending])

    // useMutation to create/edit objective
        const createOrEditObjectiveMutation = useMutation({ //defines the useMutationResult obj that is used to call the mutation function and onsuccess behaviour
            mutationFn: mutateEntityRequest,
            onSuccess: () => {
                setIsModalOpen(false)
                setForm("")
            }
        })
    
        const onSubmitForm = (e) => {// call mutate function to create/update a task
            e.preventDefault()
            createOrEditObjectiveMutation.mutate({
                action: form.split("-")[0], 
                entityName: form.split("-")[1], 
                currentEntity: currentObjective, 
                handleNotification: handleNotification, 
                handleLogout: handleLogout
            })
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
                    style = {{"color": (projectTitles.includes(queryField)? "green":"red")}}
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
                            onClick={(e)=>onSubmitForm(e)} 
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
