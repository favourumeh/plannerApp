console.log(import.meta.env) //env variables defined in f/.env #
const backend_env = import.meta.env.VITE_BACKEND_ENV
var backendBaseUrl //build fails if this is not decalared
if (backend_env == "dev") {
    backendBaseUrl = import.meta.env.VITE_DEV_BACKEND_API_URL
}
else if (backend_env == "prod") {
    backendBaseUrl = import.meta.env.VITE_PROD_BACKEND_API_URL
}
else {
    console.log("Error backendBaseURL is not specified. Check frontend/.env and frontend/src/project_config.js")
}
console.log("backend_env:", backend_env)
console.log("backendbaseurl: ", backendBaseUrl )
export {backendBaseUrl}