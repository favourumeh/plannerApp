import "./signUp.css"
import {useState, useContext} from "react"
import globalContext from "../context"
import { backendBaseUrl } from "../../project_config"

const SignUp = () => {
    const {setIsModalOpen, form, setSitePage, handleNotification} = useContext(globalContext)
    const [accountDetails, setAccountDetails] = useState({username:"", email:undefined, password1:"", password2:""})

    if (form != 'sign-up') {
        return null
    }

    const handleSignUp = async(e) =>{
        e.preventDefault()
        const url = `${backendBaseUrl}/sign-up`
        //const body = {username,email,password1, password2}
        const options = {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(accountDetails),
            credentials:"include"
        }
        const resp = await fetch(url, options)
        const resp_json = await resp.json()
        
        if (resp.status == 201){
            console.log(resp_json.message)
            setIsModalOpen(false)
            setSitePage("view-guest-page")
            handleNotification(resp_json.message, "success")
        } else {
            console.log(resp_json.message)
            setIsModalOpen(false)
            handleNotification(resp_json.message, "failure")
        }
    }

    return (
        <>
        <div className="sign-up-content">
            <strong className="form-header"> Sign up to start planning ... </strong><br/>
            <div className="form-div">
                <form type="submit" className="sign-up-form" onSubmit={handleSignUp}>
                    <div className="form-group">
                        <label htmlFor="username"> Username<span className="required-asterisk">*</span>:</label>
                        <input 
                            type = "text"
                            id = "username"
                            className="sign-up-input"
                            name = "username"
                            value = {accountDetails.username}
                            onChange = {e => setAccountDetails({...accountDetails, username:e.target.value})}
                            required/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email: </label>
                        <input 
                            type = "email"
                            id = "email"
                            className="sign-up-input"
                            name = "email"
                            value = {accountDetails.email}
                            onChange = {e => setAccountDetails({...accountDetails, email:e.target.value})}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password1">Password<span className="required-asterisk">*</span>: </label>
                        <input 
                            type = "password"
                            id = "password1"
                            className="sign-up-input"
                            name = "password1"
                            value = {accountDetails.password1}
                            onChange = {e => setAccountDetails({...accountDetails, password1:e.target.value})}/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password2">Confirm<span className="required-asterisk">*</span>: </label>
                        <input 
                            type = "password"
                            id = "password2"
                            className="sign-up-input"
                            name = "password2"
                            value = {accountDetails.password2}
                            onChange = {e => setAccountDetails({...accountDetails, password2:e.target.value})}/>
                    </div>

                    <div className="btn-div">
                        <button type="submit" className="sign-up-btn" onClick={(e)=>handleSignUp(e)}>Sign-up </button>
                    </div>
                </form>
            </div>
        </div>
        <div className="empty-space-fill">
                    <strong>Favour's Planner</strong>
                </div>
        </>
    )
}

export default SignUp