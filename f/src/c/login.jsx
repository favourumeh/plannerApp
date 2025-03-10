import "./login.css"
import {useState, useContext} from "react"
import globalContext from "../context"
import { backendBaseUrl } from "../project_config"

const Login = ({setIsLoggedIn}) => {
    const {setIsModalOpen, clientAction, setClientAction, currentUser, setCurrentUser} = useContext(globalContext)
    const [accountDetails, setAccountDetails] = useState({username:"", password:"" })

    if (clientAction != 'login') {
        return null
    }

    const handlelogin = async(e) =>{
        e.preventDefault()
        const url = `${backendBaseUrl}/login`
        const options = {
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(accountDetails),
            credentials:"include"
        }
        const resp = await fetch(url, options)
        const resp_json = await resp.json()

        if (resp.status == 200){
            console.log(resp_json.message)
            setIsModalOpen(false)
            setClientAction("read-tasks")
            setCurrentUser(resp_json.user)
            setIsLoggedIn(true)
        } else {
            console.log(resp_json.message)
        }
    }

    const mandatoryIndicator = (fieldStateVar, indicator) => {
        return fieldStateVar != "" &&  typeof fieldStateVar != undefined? undefined:<span className="required-asterisk">{indicator}</span>
    }

    return (
        <>
        <div className="login-content">
            <strong className="form-header"> Account Login </strong><br/>
            <div className="form-div">
                <form className="login-form">
                    <div className="form-group">
                        <label htmlFor="username"> Username{mandatoryIndicator(accountDetails.username, "*")}:</label>
                        <input 
                            type = "text"
                            id = "username"
                            className="login-input"
                            name = "username"
                            value = {accountDetails.username}
                            onChange = {e => setAccountDetails({...accountDetails, username:e.target.value})}
                            required/>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password{mandatoryIndicator(accountDetails.password, "*")}: </label>
                        <input 
                            type = "password"
                            id = "password"
                            className="login-input"
                            name = "password"
                            value = {accountDetails.password}
                            onChange = {e => setAccountDetails({...accountDetails, password:e.target.value})}/>
                    </div>

                    <div className="btn-div">
                        <button type="submit" 
                        className="login-btn" 
                        disabled={
                            accountDetails.username=="" || typeof accountDetails.username==undefined ||
                            accountDetails.password=="" || typeof accountDetails.password==undefined? true:false} 
                        onClick={(e)=>handlelogin(e)}>Login </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}

export default Login