
const app_env = import.meta.env.VITE_APP_ENV
console.log("app_env", app_env)

let siteTitleTag = document.getElementById("site-title")
if (app_env === "dev") {
    siteTitleTag.innerText = "dev - PlannerApp"
} else if (["prod-local"].includes(app_env)) {
    siteTitleTag.innerText = "rasp-pi - PlannerApp"
}else if (app_env == "prod-local-docker") {
    siteTitleTag.innerText = "rasp-pi - plannerApp"
}else {
    siteTitleTag.innerText = "PlannerApp"
}
