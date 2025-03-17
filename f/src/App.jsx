import { useState, useEffect, useRef } from 'react'
import './App.css'
import { backendBaseUrl } from './project_config'
import { fetchAllUserContent, fetchUserProjects, fetchUserObjectives, fetchUserTasks } from './fetch_entities'
import GuestPage from './c/guestPage'
import globalContext from './context'
import Modal from "./c/modal.jsx"
import SignUp from './c/signUp.jsx'
import Login from "./c/login.jsx"
import NotificationBar from './c/notificationBar.jsx'
import HomePage from './c/homePage.jsx'

const persistState = (sessionName, default_) => {
    var state = JSON.parse(sessionStorage.getItem(sessionName))
    return state!=null? state:default_ 
}

function App() {
    const [isModalOpen, setIsModalOpen] = useState(() => persistState("isModalOpen",false))
    const [isLoggedIn, setIsLoggedIn] = useState(() => persistState("isLoggedIn",false))
    const [clientAction, setClientAction] = useState(() => persistState("clientAction","")) //sign-up, login
    const [currentUser, setCurrentUser] = useState(() => persistState("currentUser",{}))
    const [notificationMessage, setNotificationMessage] = useState("")
    const [isNotiBarVisible, setIsNotiBarVisible] = useState(false)
    const [isNotiMessageError, setIsNotiMessageError] = useState(false) // determines the colour of the noti message bar (green or red)
    const [tasks, setTasks] = useState(() => persistState("tasks",[])) 
    const [objectives, setObjectives] = useState(() => persistState("objectives",[])) 
    const [projects, setProjects] = useState(() => persistState("projects",[])) 
    const [defaultProject, setDefaultProject] = useState(() => persistState("defaultProject",{})) 
    const [defaultProjectObjective, setDefaultProjectObjective] = useState(() => persistState("defaultProjectObjective",{}))
    const requestAmount = useRef(0)
    const notiBarTimerRef = useRef()

    //Update session storage object when state variable changes
    useEffect(() => sessionStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn)), [isLoggedIn])
    useEffect(() => sessionStorage.setItem("isModalOpen", JSON.stringify(isModalOpen)), [isModalOpen])
    useEffect(() => sessionStorage.setItem("clientAction", JSON.stringify(clientAction)), [clientAction])
    useEffect(() => sessionStorage.setItem("currentUser", JSON.stringify(currentUser)), [currentUser])
    useEffect(() => sessionStorage.setItem("tasks", JSON.stringify(tasks)), [tasks])
    useEffect(() => sessionStorage.setItem("objectives", JSON.stringify(objectives)), [objectives])
    useEffect(() => sessionStorage.setItem("projects", JSON.stringify(projects)), [projects])
    useEffect(() => sessionStorage.setItem("defaultProject", JSON.stringify(defaultProject)), [defaultProject])
    useEffect(() => sessionStorage.setItem("defaultProjectObjective", JSON.stringify(defaultProjectObjective)), [defaultProjectObjective])


    const handleNotification = (message, category) => {
        setIsNotiBarVisible(true)
        setNotificationMessage(message)
        setIsNotiMessageError(category=="success"? false:true)
        requestAmount.current += 1
    } 

    // create fetch functions that interact with app's state
    const fetchAllContent = () => fetchAllUserContent(setProjects, setDefaultProject, setObjectives, setDefaultProjectObjective, setTasks, handleNotification)

    const handleLogin = async (user) => {
        setCurrentUser(user)
        setIsLoggedIn(true)
        setIsModalOpen(false)
        setClientAction("view-homepage")
        fetchAllContent()
    }

    const clearContent = () => {
        setTasks([])
        setProjects([])
        setObjectives([])
        setDefaultProject({})
        setDefaultProjectObjective({})
    }

    const handleLogout = () => {
        setCurrentUser({})
        setIsLoggedIn(false)
        setClientAction("logout")
        isModalOpen && setIsModalOpen(false) // && returns first falsey value. if both falsey then return last value
        clearContent()
    }

    // create global prop object
    const globalProps = {
        isModalOpen, setIsModalOpen,
        clientAction, setClientAction,
        currentUser, setCurrentUser,
        notificationMessage, setNotificationMessage,
        isNotiBarVisible, setIsNotiBarVisible,
        isNotiMessageError, setIsNotiMessageError,
        tasks, setTasks, 
        objectives, setObjectives,
        projects, setProjects,
        handleNotification, requestAmount, notiBarTimerRef,
        handleLogin, handleLogout,
        fetchAllContent, defaultProject, defaultProjectObjective
    }

    return (
        <>
        <globalContext.Provider value={globalProps}>
            <NotificationBar/>
            <GuestPage isLoggedIn={isLoggedIn}/>
            <Modal>
                <SignUp/>
                <Login isLoggedIn={isLoggedIn}/>
            </Modal>
            <HomePage isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}/>
        </globalContext.Provider>
        </>
    )
    }

export default App
