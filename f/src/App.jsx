import { useState, useEffect, useRef } from 'react'
import './App.css'
import { backendBaseUrl } from './project_config.js'
import { fetchAllUserContent} from './fetch_entities'
import GuestPage from './c/guestPage'
import globalContext from './context'
import Modal from "./c/modal.jsx"
import SignUp from './c/signUp.jsx'
import Login from "./c/login.jsx"
import NotificationBar from './c/notificationBar.jsx'
import HomePage from './c/homePage.jsx'
import TaskForm from "./c/taskForm.jsx"
import ProjectForm from "./c/projectForm.jsx"
import EntityPage from './c/entityPage.jsx'
import ObjectiveForm from './c/objectiveForm.jsx'
import Kanban from './c/kanban.jsx'
import ProgressPage from './c/progressPage/progressPage.jsx'

const persistState = (sessionName, default_) => {
    var state = JSON.parse(sessionStorage.getItem(sessionName))
    return state!=null? state:default_ 
}

function App() {
    const [isModalOpen, setIsModalOpen] = useState(() => persistState("isModalOpen",false))
    const [isLoggedIn, setIsLoggedIn] = useState(() => persistState("isLoggedIn",false))
    const [sitePage, setSitePage] = useState(() => persistState("sitePage","")) // view-guest-page, view-webpage, view-projects, view-objectives, view-tasks
    const [form, setForm]  = useState(() => persistState("form", "")) //sign-up, login, create/edit-task, create/edit-objective, create/edit-project
    const [currentUser, setCurrentUser] = useState(() => persistState("currentUser",{}))
    const [notificationMessage, setNotificationMessage] = useState("")
    const [isNotiBarVisible, setIsNotiBarVisible] = useState(false)
    const [isNotiMessageError, setIsNotiMessageError] = useState(false) // determines the colour of the noti message bar (green or red)
    const [tasks, setTasks] = useState(() => persistState("tasks",[])) 
    const [objectives, setObjectives] = useState(() => persistState("objectives",[])) 
    const [projects, setProjects] = useState(() => persistState("projects",[])) 
    const [defaultProject, setDefaultProject] = useState(() => persistState("defaultProject",{})) 
    const [defaultProjectObjective, setDefaultProjectObjective] = useState(() => persistState("defaultProjectObjective",{}))
    const [formProject, setFormProject] = useState(defaultProject)
    const [formObjective, setFormObjective] = useState(defaultProjectObjective)
    const [currentTask, setCurrentTask] = useState(() => persistState("currentTask", {status:"To-Do", isRecurring:false, priorityScore:1, projectTitle:"", objectiveTitle:""}))
    const [currentObjective, setCurrentObjective] = useState(() => persistState("currentObjective", {status:"To-Do"}))
    const [currentProject, setCurrentProject] = useState(() => persistState("currentProject", {status:"To-Do"}))
    const [showProjectQueryResult, setShowProjectQueryResult] = useState(false)
    const [showObjectiveQueryResult, setShowObjectiveQueryResult] = useState(false)
    const [homePageTasks, setHomePageTasks] = useState(()=>persistState("homePageTasks",[]))
    const [currentDate, setCurrentDate] = useState(() => persistState("currentDate", new Date()))
    const [entityName, setEntityName] = useState(sitePage==="view-projects"? "project": sitePage==="view-objectives"? "objective":"task")
    const [entity, setEntity] = useState(sitePage==="view-projects"? projects: sitePage==="view-objectives"? objectives:tasks)
    const [userSettings, setUserSettings] = useState({"dayStartTime":"08:00", "dayEndTime":"20:30", "timeIntervalInMinutes":50})
    const notiBarTimerRef = useRef()
    const [hoverText, setHoverText] = useState("")
    const [isShowHoverText, setIsShowHoverText] = useState(true)

    //Update session storage object when state variable changes
    useEffect(() => sessionStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn)), [isLoggedIn])
    useEffect(() => sessionStorage.setItem("isModalOpen", JSON.stringify(isModalOpen)), [isModalOpen])
    useEffect(() => sessionStorage.setItem("sitePage", JSON.stringify(sitePage)), [sitePage])
    useEffect(() => sessionStorage.setItem("form", JSON.stringify(form)), [form])
    useEffect(() => sessionStorage.setItem("currentUser", JSON.stringify(currentUser)), [currentUser])
    useEffect(() => sessionStorage.setItem("tasks", JSON.stringify(tasks)), [tasks])
    useEffect(() => sessionStorage.setItem("objectives", JSON.stringify(objectives)), [objectives])
    useEffect(() => sessionStorage.setItem("projects", JSON.stringify(projects)), [projects])
    useEffect(() => sessionStorage.setItem("defaultProject", JSON.stringify(defaultProject)), [defaultProject])
    useEffect(() => sessionStorage.setItem("defaultProjectObjective", JSON.stringify(defaultProjectObjective)), [defaultProjectObjective])
    useEffect(() => sessionStorage.setItem("currentTask", JSON.stringify(currentTask)), [currentTask])
    useEffect(() => sessionStorage.setItem("currentProject", JSON.stringify(currentProject)), [currentProject])
    useEffect(() => sessionStorage.setItem("currentObjective", JSON.stringify(currentObjective)), [currentObjective])
    useEffect(() => sessionStorage.setItem("homePageTasks", JSON.stringify(homePageTasks)), [homePageTasks])
    useEffect(() => sessionStorage.setItem("currentDate", JSON.stringify(currentDate)), [currentDate])

    const handleNotification = (message, category) => {
        setIsNotiBarVisible(true)
        setNotificationMessage(message)
        setIsNotiMessageError(category=="success"? false:true)
    } 

    // create fetch functions that interact with app's state
    const fetchAllContent = () => fetchAllUserContent(setProjects, setDefaultProject, setObjectives, setDefaultProjectObjective, setTasks, handleNotification)

    const handleLogin = async (user) => {
        setCurrentUser(user)
        setIsLoggedIn(true)
        setIsModalOpen(false)
        setSitePage("view-homepage")
        fetchAllContent()
    }

    const clearContent = () => {
        setTasks([])
        setProjects([])
        setObjectives([])
        setDefaultProject({})
        setDefaultProjectObjective({})
        setHomePageTasks([])
    }

    const handleLogout = () => {
        onLogout()
        setCurrentUser({})
        setIsLoggedIn(false)
        setSitePage("logout")
        setForm("") 
        isModalOpen && setIsModalOpen(false) // && returns first falsey value. if both falsey then return last value
        clearContent()
    }

    const handleRefresh = async (hideNoti=true) => {
        try {
            fetchAllContent()
            hideNoti || handleNotification("User content refreshed", "success")
        } catch {
            handleLogout()
            handleNotification("Could not refresh User Content", "failure")
        }
    }

    const onLogout = async() => {
        const url = `${backendBaseUrl}/logout`
        const options = {
            method:"GET",
            headers:{"Content-Type":"application/json"},
            credentials:"include"
        }
        const resp = await fetch(url, options)
        const resp_json = await resp.json() 

        if (resp.status == 200) {
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
        }else {
            console.log(resp_json.message)
        }
    }

    const handleDeleteEntity = async (e, entityName, id) => {
        e.preventDefault()
        try {
            const url = `${backendBaseUrl}/delete-${entityName}/${id}`
            const options = {
                method:"DELETE",
                headers:{"content-type":"application/json"},
                credentials:"include"
            }
            var resp = await fetch(url,options)
            var resp_json = await resp.json()
        } catch (err) {
            handleNotification(err.message + `. Failed to DELETE ${entityName}. Error in fetch (NOT API)`, "failure")
            handleRefresh()
        }

        if (resp.status==200){
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
            handleRefresh()
        } else if ([400, 403, 404].includes(resp.status)) {
            console.log(resp_json.message)
            handleNotification(resp_json.message, "failure")
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
                handleDeleteEntity(e, entityName, id)
            }
        }

    }

    const handleEntitySubmit = async(e, action, entityName, currentEntity) =>{
        //Makes a (POST or PATCH) request to the backend to to create or update an entity
            //action: one of: create or update
            //enityName: one of project, objective or task
            //currentEntity: one of currentTask, currentProject or currentObjective
        e? e.preventDefault(): undefined
        try {
            const url = `${backendBaseUrl}/${ action + "-" + entityName + (action == "create"? "": "/" + currentEntity.id) }`
            const options = {
                method:action=="create"? "POST":"PATCH",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(currentEntity),
                credentials:"include"
            }
            var resp = await fetch(url, options)
            var resp_json = await resp.json()
        } catch (err) {
            handleNotification(err.message + `. Failed to DELETE ${entityName}. Error in fetch (NOT API)`, "failure")
            handleRefresh()
        }

        if ([200, 201].includes(resp.status)){
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
            setIsModalOpen(false)
            setForm("")
            handleRefresh()
        } else if ([400, 403, 404].includes(resp.status)) {
            console.log(resp_json.message)
            handleNotification(resp_json.message, "failure")
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
                handleEntitySubmit(e, action, entityName, currentEntity)
            }
        }
    }

    
    const formatDateFields = (entity) => {// Formats datetime string: Thu, 27 Mar 2025 09:09:00 GMT ==> 2025-03-27T09:00 
        const allDateFields = ["scheduledStart", "scheduledFinish", "start", "finish", "deadline"]
        const dateTimeFields = ["start", "finish"]
        for (const dateField of allDateFields) {
            if (Object.keys(entity).includes(dateField) && !!entity[dateField]) {
                const formattedDateTime = new Date(entity[dateField]).toISOString().replace(/:\d{2}\.\d{3}Z$/, '')
                const formattedDate = new Date(entity[dateField]).toISOString().split("T")[0]
                var entity = {...entity, [dateField]: dateTimeFields.includes(dateField)? formattedDateTime:formattedDate} //#1
            }
        }
        return entity
    } 

    // Hover Functions 
    const onShowHoverText = (text) => {
        setIsShowHoverText(true)
        setHoverText(text)
    }

    const onHideHoverText = () => {
        setIsShowHoverText(false)
        setHoverText("")
    }

    const findTaskObjective = (objectives, task) => objectives.find((objective)=> objective.id===task.objectiveId )
    const findObjectiveProject = (projects, objective) => projects.find((project)=> project.id===objective.projectId)

    const getProject = (entity, entityName, projects, objectives) => {
        //get the project of an objective or task. If entity is a project return entity.
        if (entityName === "task") {
            return findObjectiveProject(projects, findTaskObjective(objectives, entity))
        } else if (entityName === "objective") {
            return findObjectiveProject(projects, entity)
        } else {
            return entity
        }
    }
    
    const getObjective = (entity, entityName, objectives) => {
        //get the objective of a task entity. Return entity and null if the entity is an objetive and project respectively.  
        if (entityName === "task") {
            return findTaskObjective(objectives, entity)
        } else if (entityName === "objective") {
            return entity
        } else {
            return null
        }
    }

    // create global prop object
    const globalProps = {
        isModalOpen, setIsModalOpen,
        sitePage, setSitePage,
        currentUser, setCurrentUser,
        notificationMessage, setNotificationMessage,
        isNotiBarVisible, setIsNotiBarVisible,
        isNotiMessageError, setIsNotiMessageError,
        tasks, setTasks, 
        objectives, setObjectives,
        projects, setProjects,
        handleNotification, notiBarTimerRef,
        handleLogin, handleLogout,
        fetchAllContent, handleRefresh, 
        defaultProject, defaultProjectObjective, formProject, formObjective,
        setDefaultProject, setDefaultProjectObjective, setFormProject, setFormObjective,
        currentTask, setCurrentTask,
        currentProject, setCurrentProject,
        currentObjective, setCurrentObjective,
        showProjectQueryResult, setShowProjectQueryResult,
        showObjectiveQueryResult, setShowObjectiveQueryResult,
        handleDeleteEntity, 
        form, setForm, handleEntitySubmit,
        currentDate, setCurrentDate, 
        entityName, setEntityName, entity, setEntity,
        userSettings, setUserSettings, formatDateFields,
        onShowHoverText, onHideHoverText, isShowHoverText, hoverText,
        getProject, getObjective
    }

    return (
        <>
        <globalContext.Provider value={globalProps}>
            <NotificationBar/>
            <GuestPage isLoggedIn={isLoggedIn}/>
            <Modal>
                <SignUp/>
                <Login isLoggedIn={isLoggedIn}/>
                <TaskForm/>
                <ProjectForm/>
                <ObjectiveForm/>
            </Modal>
            <HomePage isLoggedIn={isLoggedIn} sitePage = {sitePage} homePageTasks={homePageTasks} setHomePageTasks={setHomePageTasks}/>
            <EntityPage sitePage={sitePage} setSitePage={setSitePage}/>
            <Kanban sitePage={sitePage}/>
            <ProgressPage sitePage={sitePage}/>
        </globalContext.Provider>
        </>
    )
    }

export default App
