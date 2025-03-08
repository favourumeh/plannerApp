import { backendBaseUrl } from "./project_config"

const fetchProjects = async () => {
    return null
}

const fetchObjectives = async () => {
    return null
}

const fetchTasks = async () => {
    const url = `${backendBaseUrl}/read-tasks`
    const options = {
        "method":"GET",
        "headers": {
          "Content-Type":"application/json"
        },
        "credentials":"include"
    }
    const resp = await fetch(url, options)
    const resp_json = await resp.json()

    if (resp.status == 200){
      console.log(resp_json.message)
      setTasks(resp_json.tasks)
    } else {
      console.log(resp)
    }
}

export {fetchProjects,fetchObjectives, fetchTasks}