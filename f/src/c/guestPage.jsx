import "./guestPage.css"
import { useContext } from "react"
import globalContext from "../context.js"

const  GuestPage = ({isLoggedIn}) => {
    const {setIsModalOpen, setForm} = useContext(globalContext)

    if (isLoggedIn) {
        return null 
    }

    const handleSignUp = () => {
        setIsModalOpen(true)
        setForm("sign-up")
    }

    const handleLogin = () => {
        setIsModalOpen(true)
        setForm("login")
    }
    
    return (
        <div className="guest-page">
            <h1>Welcome to Favour's Planner</h1>
            <div className="flex-container">
                <div className="guest-prompts">
                    <span className="new-user-prompt">New User: </span>
                    <span className="existing-user-prompt">Existing User: </span>
                </div>

                <div className="guest-buttons">
                    <button id="signup-btn" className="guestPageBtn" onClick={handleSignUp}>Sign-up</button>
                    <button id="login-btn" className="guestPageBtn" onClick={handleLogin}>Login</button>
                </div>
            </div>
        
        </div>



    )
}


export default GuestPage
