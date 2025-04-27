
//default entities
const defaultTask = {
    isRecurring:false, 
    priorityScore:1, 
    status:"To-Do",
    description:"", 
    durationEst:10, 
    scheduledStart: new Date().toISOString().split("T")[0], 
    start:"", 
    finish:"",
    tag:""
}

const defaultObjective = {
    status:"To-Do",
    description:"", 
    title:"",
    deadline:"",
    tag:""
}

const defaultProject = {
    status:"To-Do",
    description:"", 
    title:"",
    deadline:"",
    tag:""
}

// colour dict for the progress page
const colourDict = {
    "red":"rgba(255, 59, 48, 0.8)",
    "orange": "rgba(255, 149, 0, 0.8)",
    "yellow":"rgba(255, 204, 0, 0.8)",
    "light-green": "rgba(52, 199, 89, 0.6)",
    "green": "rgba(48, 209, 88, 0.8)"
}

export {defaultTask, defaultObjective, defaultProject, colourDict}