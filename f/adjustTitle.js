
const app_env = import.meta.env.VITE_APP_ENV

let siteTitleTag = document.getElementById("site-title")
if (app_env === "dev") {
    siteTitleTag.innerText = "dev - PlannerApp "
} else if (app_env ==="prod-local") {
    siteTitleTag.innerText = "prod-local - PlannerApp"
} else {
    siteTitleTag.innerText = "PlannerApp"
}