
const app_env = import.meta.env.VITE_APP_ENV
console.log("app_env", app_env)

let siteTitleTag = document.getElementById("site-title")
if (app_env === "dev") {
    siteTitleTag.innerText = "dev - PlannerApp"
} else if (["prod-local-docker", "prod-local"].includes(app_env)) {
    siteTitleTag.innerText = "prod-local - PlannerApp"
} else {
    siteTitleTag.innerText = "PlannerApp"
}