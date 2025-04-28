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

const fetchUserTasks = async (setTasks, handleNotification) => {
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

export {fetchAllUserContent, fetchUserProjects,fetchUserObjectives, fetchUserTasks}