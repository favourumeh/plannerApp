console.log(import.meta.env) //env variables defined in f/.env #
const app_env = import.meta.env.VITE_APP_ENV
var backendBaseUrl //build fails if this is not decalared
if (app_env === "dev" || app_env === "prod-local") {
    backendBaseUrl = import.meta.env.VITE_DEV_BACKEND_API_URL
}
else if (app_env === "prod") {
    backendBaseUrl = import.meta.env.VITE_PROD_BACKEND_API_URL
}
else {
    console.log("Error backendBaseURL is not specified. Check f/.env and f/src/project_config.js")
}
console.log("app_env:", app_env)
console.log("backendbaseurl: ", backendBaseUrl )
export {backendBaseUrl}