console.log(import.meta.env) //env variables defined in f/.env.development or f/.env.production #
const backendBaseUrl = import.meta.env.VITE_BACKEND_API_URL
const backendEnv = import.meta.env.VITE_APP_ENV
console.log("backendbaseurl: ", backendBaseUrl )
export {backendBaseUrl, backendEnv}