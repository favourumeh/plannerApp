console.log(import.meta.env) //env variables defined in f/.env #
const backendBaseUrl = import.meta.env.VITE_BACKEND_API_URL
console.log("backendbaseurl: ", backendBaseUrl )
export {backendBaseUrl}