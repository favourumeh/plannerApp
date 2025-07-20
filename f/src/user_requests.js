import { backendBaseUrl } from "../project_config"

export async function login({accountDetails, handleLogin, handleNotification}){
    const url = `${backendBaseUrl}/login`
    const options = {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(accountDetails),
        credentials:"include"
    }
    try{
        var resp = await fetch(url, options)
        var resp_json = await resp.json()
    } catch (err) {
        handleNotification(err.message + `. Failed to Login. Likely DB connection error.`, "failure")
    }

    if (resp.status == 200){
        console.log(resp_json.message)
        handleLogin(resp_json.user)
        console.log("isLoggedIn", isLoggedIn)
    } else {
        console.log(resp_json.message)
        handleNotification(resp_json.message, "failure")
    }
}