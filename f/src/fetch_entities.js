import { backendBaseUrl } from "../project_config"

export async function retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout) {
    if  ( resp.status === 401 ) {
        console.log(resp_json.message)
        const resp_ref = await fetch(`${backendBaseUrl}/refresh`, {"credentials":"include"})
        const resp_ref_json = await resp_ref.json()
        // handleNotification(resp_json.message + ". Refreshing...try again", "failure")
        // console.log("resp ref status", resp_ref.status)
        if (resp_ref.status !== 200) {
            console.log(resp_ref_json.message)
            handleNotification(resp_ref_json.message, "failure")
            handleLogout()
            return resp_ref_json
        } else {
            console.log(resp_ref_json.message)
            return requestFn()
        }
    }
    return resp_json
}

const fetchAllUserContent = async (setProjects, setFormProject, setObjectives, setFormObjective, setTasks, handleNotification, handleLogout) => {
    try {
        const url = `${backendBaseUrl}/read-all`
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (error) {
        console.error("Error fetching all user content:", error)
        handleNotification(`Error fetching all user content. R: Database connection down or API error. Please wait a few mins.`, "failure")
        return 500
    }
    if (resp.status == 200){
        console.log(resp_json.message)
        const projects = resp_json.projects
        const objectives = resp_json.objectives
        const tasks = resp_json.tasks
        setProjects(projects)
        setFormProject(projects.filter((project)=> project["type"]=="default project")[0])
        setObjectives(objectives)
        setFormObjective(objectives.filter((objective) => objective["type"]=="default project objective")[0])
        setTasks(tasks)
    } else if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
    } else {
        const requestFn = async() => fetchAllUserContent(setProjects, setFormProject, setObjectives, setFormObjective, setTasks, handleNotification)
        resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
        console.log("resp_json (in fechtAll)", resp_json)
        return !resp_json.project?  !!resp_json.message? 401 : Number.isInteger(resp_json)? resp_json : 500 : 200
    } 
    return resp.status
}

const fetchUserEntityPage = async (entityName, handleNotification, handleLogout, page, perPage=23) => {
    //fetch user task, objectives or projects w/ pagination
    try{
        const baseUrl =  `${backendBaseUrl}/query-${entityName}s?`
        const query = new URLSearchParams({"page":page, "perPage":perPage})
        const url = baseUrl + query
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to READ ${entityName}. Either DB connection error or error not prevented by api unit test.`, "failure")
    }

    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
        return resp_json
    }
    const requestFn = async() => fetchUserEntityPage(entityName, handleNotification, handleLogout, page, perPage=23)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

const fetchHomepageTasks = async (selectedDate, handleNotification, handleLogout) => {
    try{
        const baseUrl =  `${backendBaseUrl}/query-tasks?`
        const query = new URLSearchParams({"selectedDate":selectedDate, "sitePage":"homepage"})
        const url = baseUrl + query
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to fetch homepage tasks (fetchHomepageTasks()).  Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    const requestFn = async() => fetchHomepageTasks(selectedDate, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

const fetchTasksObjectiveAndProject = async (taskId, handleNotification, handleLogout) => {
    try{
        const url =  `${backendBaseUrl}/get-tasks-objective-and-project/${taskId}`
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(`Failed in to fetch Task's project and objective (fetchTasksObjectiveAndProject()). Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
        return resp_json
    }
    const requestFn = async() => fetchTasksObjectiveAndProject(taskId, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function fetchObjectivesProject(objectiveId, handleNotification, handleLogout) {
    try{
        const url =  `${backendBaseUrl}/get-objectives-project/${objectiveId}`
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } 
    catch (err) {
        handleNotification(`Failed in to fetch Objective's project (fetchObjectivesProject()). Either DB connection error or error not prevented by api unit test.`, "failure")
    }   
    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
        return resp_json
    }
    const requestFn = async() => fetchObjectivesProject(objectiveId, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

const fetchKanbanTasks = async (selectedDate, handleNotification, handleLogout) => {
    try{
        const baseUrl =  `${backendBaseUrl}/query-tasks?`
        const query = new URLSearchParams({"selectedDate":selectedDate, "sitePage":"kanban"})
        const url = baseUrl + query
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to fetch kanban tasks (fetchKanbanTasks()).  Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
        return resp_json
    }
    const requestFn = async() => fetchKanbanTasks(selectedDate, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json

}

export async function fetchProjectsObjectives(projectId, handleNotification, handleLogout) {
    //gets all objectives that belong to a project
    try{
        const baseUrl =  `${backendBaseUrl}/query-objectives?`
        const query = new URLSearchParams({"projectId":projectId})
        const url = baseUrl + query
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to fetch kanban tasks (fetchProjectsObjectives()).  Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
        return resp_json
    }
    const requestFn = async() => fetchProjectsObjectives(projectId, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function mutateEntityRequest(action, entityName, currentEntity, handleNotification, handleLogout) {
    //Makes a (POST or PATCH) request to the backend to to create or update an entity
    //action: one of: create or update or delete
    //enityName: one of project, objective or task
    //currentEntity: for update and delete actions these are the entiteis (task, objective or project) to edit or delete
    try {
        const url = `${backendBaseUrl}/${ action + "-" + entityName + (action == "create"? "": "/" + currentEntity.id) }`
        const options = {
            method:action==="create"? "POST": action==="update"? "PATCH": "DELETE",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(currentEntity),
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to ${action} ${entityName}. Either connection error or error not prevented by api unit test.`, "failure")
    }
    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
        return resp_json
    }
    const requestFn = async() => postEntity(action, entityName, currentEntity, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json

} 

export {fetchAllUserContent, fetchUserEntityPage, fetchHomepageTasks, fetchTasksObjectiveAndProject, fetchKanbanTasks}