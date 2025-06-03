
//default entities
const defaultTask = {
    isRecurring:false, 
    priorityScore:1, 
    status:"To-Do",
    description:"", 
    durationEst:10,
    duration:null, 
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

export {defaultTask, defaultObjective, defaultProject}