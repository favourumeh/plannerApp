import { backendBaseUrl } from "../project_config"

const fetchAllUserContent = async (setProjects, setFormProject, setObjectives, setFormObjective, setTasks, handleNotification) => {
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
        handleNotification(`Error fetching all user content. R: Database is most likely down. Please wait a few mins.`, "failure")
        return resp.status
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
    } else {
        console.log(resp_json.message)
        const resp_ref = await fetch(`${backendBaseUrl}/refresh`, {credentials:"include"})
        const resp_ref_json = await resp_ref.json()
        if (resp_ref.status == 200){
            console.log(resp_ref_json.message)
            fetchAllUserContent(setProjects, setFormProject, setObjectives, setFormObjective, setTasks, handleNotification)
        } else {
            console.log(resp_ref_json.message)
            handleNotification(resp_ref_json.message, "failure")
        }
    }
    return resp.status
}

const fetchUserProjects = async (setProjects, handleNotification, setFormProject) => {
    const url = `${backendBaseUrl}/read-projects`
    const options = {
        method:"GET",
        headers: {"Content-Type":"application/json"},
        credentials:"include"
    }
    const resp = await fetch(url, options)
    const resp_json = await resp.json()

    if (resp.status == 200){
        console.log(resp_json.message)
        const projects = resp_json.projects
        setProjects(projects)
        setFormProject(projects.filter((project)=> project["type"]=="default project")[0])
        // console.log(resp_json.projects)
    } else {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
    }
}

const fetchUserObjectives = async (setObjectives, handleNotification, setFormObjective) => {
    const url = `${backendBaseUrl}/read-objectives`
    const options = {
        method:"GET",
        headers: {"Content-Type":"application/json"},
        credentials:"include"
    }
    const resp = await fetch(url, options)
    const resp_json = await resp.json()

    if (resp.status == 200){
        console.log(resp_json.message)
        const objectives = resp_json.objectives
        setObjectives(objectives)
        setFormObjective(objectives.filter((objective) => objective["type"]=="default project objective")[0].id)
        // console.log(resp_json.objectives)
    } else {
        console.log(resp)
        handleNotification(resp_json.message, "failure")
    }
}

const fetchAllUserTasks = async (setTasks, handleNotification) => {
    //fetch user task w/o pagination
    const url = `${backendBaseUrl}/read-tasks`
    const options = {
        method:"GET",
        headers: {"Content-Type":"application/json"},
        credentials:"include"
    }
    const resp = await fetch(url, options)
    const resp_json = await resp.json()

    if (resp.status == 200){
      console.log(resp_json.message)
      setTasks(resp_json.tasks)
    //   console.log(resp_json.tasks)
    } else {
      console.log(resp)
      handleNotification(resp_json.message, "failure")
    }
}

const fetchUserEntityPage = async (entityName, handleNotification, page, perPage=23) => {
    //fetch user task, objectives or projects w/ pagination

    try{
        const baseUrl =  `${backendBaseUrl}/read-${entityName==="project"? "project": entityName==="objective"? "objective" : "task"}s-pag?`
        const query = new URLSearchParams({"page":page, "per_page":perPage})
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

    if  (resp.status === 401 ) {
        console.log(resp_json.message)
        const resp_ref = await fetch(`${backendBaseUrl}/refresh`, {"credentials":"include"})
        const resp_ref_json = await resp_ref.json()
        handleNotification(resp_json.message + ". Refreshing...try again", "failure")
        if (resp_ref.status !=200) {
            console.log(resp_ref_json.message)
            handleLogout()
            handleNotification(resp_ref_json.message, "failure")
            return resp_json
        } else {
            // handleNotification(resp_ref_json.message, "success")
            console.log(resp_ref_json.message)
            fetchUserEntityPage(entityName, page, perPage)
        }
    }
    return resp_json
}

export {fetchAllUserContent, fetchUserProjects,fetchUserObjectives, fetchAllUserTasks, fetchUserEntityPage}