import Dropdown from "../dropdown"
import globalContext from "../../context"
import { useContext } from "react"

function ViewPage() {
    const { sitePage, setSitePage,tasks, projects, objectives, setEntityName, setEntity} = useContext(globalContext);    
    const onClickViewProjects = () => {
        setSitePage("view-projects")
        setEntityName("project")
        setEntity(projects)
    }
    const onClickViewObjectives = () => {
        setSitePage("view-objectives")
        setEntityName("objective")
        setEntity(objectives)
    }

    const onClickViewTasks = () => {
        setSitePage("view-tasks")
        setEntityName("task")
        setEntity(tasks)
    }

    const onClickViewKanban = () => {
        setSitePage("view-kanban")
        setEntityName("task")
        setEntity(tasks)
    }
    const onClickViewProgress = () => {
        setSitePage("view-progress")
    }

    return (
        <Dropdown buttonContent={<i className="fa fa-eye" aria-hidden="true"></i>} translate={"0% 30%"}>
            {sitePage=="view-projects"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewProjects}> view projects </div>}
            {sitePage=="view-objectives"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewObjectives}> view objectives </div>}
            {sitePage=="view-tasks"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewTasks}> view tasks </div>}
            {sitePage=="view-kanban"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewKanban}> view kanban </div>}
            {sitePage=="view-progress"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewProgress}> view progress </div>}
        </Dropdown>
    )
}

export default ViewPage