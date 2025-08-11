import { backendBaseUrl } from "../project_config"

export async function retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout) {
    if  ( resp.status === 401 ) {
        console.log(resp_json.message)
        const resp_ref = await fetch(`${backendBaseUrl}/refresh`, {"credentials":"include"})
        const resp_ref_json = await resp_ref.json()
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

const handleNon401Requests = ({resp, resp_json, handleNotification, showSuccessNoti}) => {// handles the following requests: 200, 201, 400, 403, 404
    if ([200, 201].includes(resp.status)) {
        showSuccessNoti && handleNotification(resp_json.message, "success")
    }
    if ([400, 403, 404].includes(resp.status)) {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
    }
}

export async function fetchUserProjects(showNoti=false, handleNotification, handleLogout) { //fetches all user's projects
    try{
        const url = `${backendBaseUrl}/read-projects`
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to Get all ${entityName}s. Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: showNoti})

    const requestFn = async() => fetchUserProjects(showNoti, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function fetchObjectiveTasks({objectiveId, handleNotification, handleLogout}) {//fetches all tasks that belong to an objective
    try{
        const url = `${backendBaseUrl}/query-tasks?` + new URLSearchParams({"objectiveId":objectiveId})
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to get the Objective's tasks. Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})

    const requestFn = async() => fetchObjectiveTasks(objectiveId, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function fetchBreakObjective(handleNotification, handleLogout) { //fetches all user's projects
    try{
        const url = `${backendBaseUrl}/query-objectives?` + new URLSearchParams({"type":"break"})
        const options = {
            method:"GET",
            headers: {"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + ". Failed to the break objective. Either DB connection error or error not prevented by api unit test.", "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
    const requestFn = async() => fetchBreakObjective(handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
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
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
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
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
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
        handleNotification(`Failed to fetch Task's project and objective (fetchTasksObjectiveAndProject()). Either DB connection error or error not prevented by api unit test.`, "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
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
        handleNotification(`Failed to fetch Objective's project (fetchObjectivesProject()). Either DB connection error or error not prevented by api unit test.`, "failure")
    }   
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
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
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
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
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
    const requestFn = async() => fetchProjectsObjectives(projectId, handleNotification, handleLogout)
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function mutateEntityRequest({action, entityName, currentEntity, handleNotification, handleLogout}) {
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
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: true})
    const requestFn = async() => mutateEntityRequest({action, entityName, currentEntity, handleNotification, handleLogout})
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
} 

export async function fetchEntityProgress({entityId, entityName, handleNotification, handleLogout}) {//fetch the progress of a project or objective
    try {
        const url = `${backendBaseUrl}/get-${entityName}-progress/${entityId}`
        const options = {
            method:"GET",
            headers:{"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to get the progress of the ${entityName}. Either connection error or error not prevented by api unit test.`, "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
    const requestFn = async() => fetchProjectProgress({entityId, entityName,handleNotification, handleLogout})
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
} 

export async function fetchPlannerTasks({periodStart, periodEnd, handleNotification, handleLogout}) {
    try {
        const baseUrl =  `${backendBaseUrl}/query-tasks?`
        const query = new URLSearchParams({sitePage:"planner", periodStart:periodStart, periodEnd:periodEnd })
        const url = baseUrl + query
        // const url = `${backendBaseUrl}/query-tasks?` + new URLSearchParams({sitePage:"planner", periodStart, periodEnd })
        const options = {
            method:"GET",
            headers:{"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to get planner's the scheduled tasks. Likely database connection error.`, "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
    const requestFn = async() => fetchPlannerTasks({periodStart, periodEnd, handleNotification, handleLogout})
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function fetchDefaultProjectObjective({projectId, handleNotification, handleLogout}) {
    try {
        const baseUrl =  `${backendBaseUrl}/query-objectives?`
        const query = new URLSearchParams({projectId:1, type:"default project objective"})
        const url = baseUrl + query
        const options = {
            method:"GET",
            headers:{"Content-Type":"application/json"},
            credentials:"include"
        }
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to get the default project objective. Likely database connection error.`, "failure")
    }
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
    const requestFn = async() => fetchDefaultProjectObjective({projectId, handleNotification, handleLogout})
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export async function bulkShiftTaskMutation({updatedTasks, handleNotification, handleLogout}) {
    try{
        const baseUrl =  `${backendBaseUrl}/bulk-update-task_schedules`
        const options = {
            method:"PATCH",
            headers:{"Content-Type":"application/json"},
            body: JSON.stringify({tasks: updatedTasks}),
            credentials:"include",
        }
        var resp = await fetch(baseUrl, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to bulk update task scheduled dates. Likely database connection error.`, "failure")
    } 
    handleNon401Requests({resp, resp_json, handleNotification, showSuccessNoti: false})
    const requestFn = async() => bulkShiftTaskMutation({updatedTasks, handleNotification, handleLogout})
    resp_json = await retryRequestOnUpdatedAT(resp, resp_json, requestFn, handleNotification, handleLogout)
    return resp_json
}

export {fetchUserEntityPage, fetchHomepageTasks, fetchTasksObjectiveAndProject, fetchKanbanTasks}