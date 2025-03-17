import { backendBaseUrl } from "./project_config"

const fetchAllUserContent = async (setProjects, setDefaultProject, setObjectives, setDefaultProjectObjective, setTasks, handleNotification) => {
    const url = `${backendBaseUrl}/read-all`
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
        const objectives = resp_json.objectives
        const tasks = resp_json.tasks

        setProjects(projects)
        setDefaultProject(projects.filter((project)=> project["type"]=="default project")[0])
        setObjectives(objectives)
        setDefaultProjectObjective(objectives.filter((objective) => objective["type"]=="default project objective")[0])
        setTasks(tasks)
    // console.log(resp_json.projects)
    } else {
    console.log(resp_json.message)
    handleNotification(resp_json.message, "failure")
    }

}
const fetchUserProjects = async (setProjects, handleNotification, setDefaultProject) => {
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
        setDefaultProject(projects.filter((project)=> project["type"]=="default project")[0])
        // console.log(resp_json.projects)
    } else {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
    }
}

const fetchUserObjectives = async (setObjectives, handleNotification, setDefaultProjectObjective) => {
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
        setDefaultProjectObjective(objectives.filter((objective) => objective["type"]=="default project objective")[0].id)
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