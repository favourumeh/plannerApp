import "./entityPage.css"
import { useState, useContext, useEffect, use } from "react"
import globalContext from "../context"
import Dropdown from "./Dropdown"
import Header from "./header"
import EntityCard from "./EntityCard"

function EntityPage () {

    const {
        sitePage, setSitePage, setForm, 
        setIsModalOpen, handleRefresh,
        tasks, projects, objectives} = useContext(globalContext)

    if (!["view-projects", "view-objectives", "view-tasks"].includes(sitePage)) {
        return null
    }

    const [entityName, setEntityName] = useState(sitePage==="view-projects"? "project": sitePage==="view-objectives"? "objective":"task")
    const [entity, setEntity] = useState(sitePage==="view-projects"? projects: sitePage==="view-objectives"? objectives:tasks)

    useEffect(() => { //update entity when tasks, projects or objectives change
        setEntity(sitePage==="view-projects"? projects: sitePage==="view-objectives"? objectives:tasks)
    }, [projects, objectives, tasks])

    const handleCreateContent = (content) => {
        setForm(`create-${content}`)
        setIsModalOpen(true)
    }

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

    return (
        <div className="entity-page">
            <div className="entity-page-header"> 
                <div className="entity-page-header-row1">
                    <Header/>
                </div>

                <div className="entity-page-header-row2">
                    <strong> {entityName.toUpperCase()}S </strong>
                </div>
                
                <div className="entity-page-header-row3">
                    <Dropdown buttonContent={<i className="fa fa-plus" aria-hidden="true"></i>}>
                        <div onClick={() => handleCreateContent("task")}> Create Task</div>
                        <div onClick={() => handleCreateContent("objective")}> Create Objective</div>
                        <div onClick={() => handleCreateContent("project")}> Create Project</div>
                    </Dropdown>
                    <Dropdown buttonContent={<i className="fa fa-eye" aria-hidden="true"></i>}>
                        {sitePage=="view-projects"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewProjects}> view projects </div>}
                        {sitePage=="view-objectives"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewObjectives}> view objectives </div>}
                        {sitePage=="view-tasks"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewTasks}> view tasks </div>}
                    </Dropdown>
                    <button type="button" className="refresh-btn" onClick={() => handleRefresh(false)} > <i className="fa fa-refresh" aria-hidden="true"></i> </button>
                    <Dropdown buttonContent={<i className="fa fa-filter" aria-hidden="true"></i>}>
                        <div> by project </div>
                        <div> by objective</div>
                        <div> by task </div>
                    </Dropdown>
                </div>
            </div>

            <div className="entity-page-body"> 
                <ol id="entity-list" className="entity-list">
                    {entity.length==0? null:entity.map((item)=> 
                        <li align="left" key={item.id}>
                            <EntityCard entity={item} entityName={entityName}/>
                        </li>
                    )}
                </ol>
            </div>

        </div>
    )
}

export default EntityPage