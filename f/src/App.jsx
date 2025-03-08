import { useState, useEffect } from 'react'
import './App.css'
import { backendBaseUrl } from './project_config'
import { fetchProjects, fetchObjectives, fetchTasks } from './fetch_entities'
import GuestPage from './c/guestPage'
import globalContext from './context'
import Modal from "./c/modal.jsx"

const persistState = (sessionName, default_) => {
    var state = JSON.parse(sessionStorage.getItem(sessionName))
    return state!=null? state:default_ 
}

function App() {
    const [isModalOpen, setIsModalOpen] = useState(() => persistState("isModalOpen",true))
    const [isLoggedIn, setIsLoggedIn] = useState(() => persistState("isLoggedIn",false))
    const [clientAction, setClientAction] = useState(() => persistState("clientAction","")) //sign-up, login, edit-notes, delete-notes
    // const [currentUser, setCurrentUser] = useState(() => persistState("currentUser",{}))
    // const [notificationMessage, setNotificationMessage] = useState("")
    // const [isNotiBarVisible, setIsNotiBarVisible] = useState(false)
    // const [isNotiMessageError, setIsNotiMessageError] = useState(false) // determines the colour of the noti message bar (green or red)

    //Update session storage object when state variable changes
    useEffect(() => sessionStorage.setItem("isLoggedIn", JSON.stringify(isLoggedIn)), [isLoggedIn])
    useEffect(() => sessionStorage.setItem("isModalOpen", JSON.stringify(isModalOpen)), [isModalOpen])
    useEffect(() => sessionStorage.setItem("clientAction", JSON.stringify(clientAction)), [clientAction])
    // useEffect(() => sessionStorage.setItem("currentUser", JSON.stringify(currentUser)), [currentUser])

    // const handleLogin = (user) => {
    //     setCurrentUser(user)
    //     setIsLoggedIn(true)
    //     setIsModalOpen(false)
    //     setClientAction("")
    // }
        
    // const handleLogout = () => {
    //     setCurrentUser({})
    //     setIsLoggedIn(false)
    //     setClientAction("")
    //     isModalOpen && setIsModalOpen(false) // && returns first falsey value. if both falsey then return last value
    // }

    // const handleNotification = (message, category) => {
    //     setIsNotiBarVisible(true)
    //     setNotificationMessage(message)
    //     setIsNotiMessageError(category=="success"? false:true)
    // } 

    const globalProps = {
        isModalOpen, setIsModalOpen,
        clientAction, setClientAction,
        // currentUser, setCurrentUser,
        // notificationMessage, setNotificationMessage,
        // isNotiBarVisible, setIsNotiBarVisible,
        // isNotiMessageError, setIsNotiMessageError,
        // handleNotification, fetchTasks, fetchObjectives, fetchProjects
    }

    return (
        <>
        <globalContext.Provider value={globalProps}>
            <GuestPage isLoggedIn={isLoggedIn}/>
            <Modal>
                <form>
                    <label for="firstName"> First Name: </label>
                    <input type="text"></input>
                    <br/>
                    <label for="firstName"> First Name: </label>
                    <input type="text"></input>
                    <br/>
                    <label for="firstName"> First Name: </label>
                    <input type="text"></input>
                </form>
            </Modal>
        </globalContext.Provider>
        </>
    )
    }

export default App
