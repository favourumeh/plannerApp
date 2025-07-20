import "./login.css"
import {useState, useContext} from "react"
import globalContext from "../../context"
import { useMutation} from "@tanstack/react-query"
import { login } from "../../user_requests"
const Login = () => {
    const {form, handleNotification, handleLogin} = useContext(globalContext)
    const [accountDetails, setAccountDetails] = useState({username:"", password:"" })

    if (form != 'login') {
        return null
    }
    const loginMutation = useMutation({
        mutationFn: login
    })

    const onSubmit = async(e) =>{
        e.preventDefault()
        loginMutation.mutate({accountDetails, handleLogin, handleNotification})
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
                        onClick={(e)=>onSubmit(e)}> {loginMutation.isPending? "loading...":"Login"} </button>
                    </div>
                </form>
            </div>
        </div>
        </>
    )
}

export default Login