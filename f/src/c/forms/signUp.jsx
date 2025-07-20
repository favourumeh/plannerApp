import "./signUp.css"
import {useState, useContext} from "react"
import globalContext from "../../context"
import { useMutation } from "@tanstack/react-query"
import { signup } from "../../user_requests"

const SignUp = () => {
    const {setIsModalOpen, form, handleNotification} = useContext(globalContext)
    const [accountDetails, setAccountDetails] = useState({username:"", email:undefined, password1:"", password2:""})

    if (form != 'sign-up') {
        return null
    }

    const signupMutation = useMutation({
        mutationFn: signup
    })

    const handleSignUp = async(e) =>{
        e.preventDefault()
        signupMutation.mutate({accountDetails, setIsModalOpen, handleNotification})
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
                        <button type="submit" className="sign-up-btn" onClick={(e)=>handleSignUp(e)}>{signupMutation.isPending? "loading...":"Sign-up"} </button>
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