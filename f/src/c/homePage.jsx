import "./homePage.css"
import { useState, useContext, useEffect } from "react"
import globalContext from "../context"
import { backendBaseUrl } from "../project_config"
import TaskCard from "./taskCard"
import Dropdown from "./Dropdown"
import Header from "./header"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let current_date = new Date()
let currentDay = daysOfWeek[current_date.getDay()]

function HomePage ({isLoggedIn}) {
    const {
        sitePage, setSitePage, setForm, handleDeleteEntity,
        setIsModalOpen, tasks, handleRefresh} = useContext(globalContext)

    if (!isLoggedIn || sitePage!=="view-homepage") {
        return null
    }

    const handleCreateContent = (content) => {
        setForm(`create-${content}`)
        setIsModalOpen(true)
    }


    return (
        <div className="homepage">
            <div className="homepage-header"> 
                <div className="homepage-header-row1">
                    <Header/>
                </div>

                <div className="homepage-header-row2">
                    <button type="button" className="yesterday-btn" > <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <strong> <span className="homepage-day">{currentDay}'s</span> Tasks </strong>
                    <button type="button" className="tomorrow-btn" > <i className="fa fa-arrow-right" aria-hidden="true"> </i> </button>
                </div>

                <div className="homepage-header-row3">
                    <Dropdown buttonContent={<i className="fa fa-plus" aria-hidden="true"></i>}>
                        <div onClick={() => handleCreateContent("task")}> Create Task</div>
                        <div onClick={() => handleCreateContent("objective")}> Create Objective</div>
                        <div onClick={() => handleCreateContent("project")}> Create Project</div>
                    </Dropdown>
                    <Dropdown buttonContent={<i className="fa fa-eye" aria-hidden="true"></i>}>
                        <div onClick={() => setSitePage("view-projects")}> view projects </div>
                        <div onClick={() => setSitePage("view-objectives")}> view objectives </div>
                        <div onClick={() => setSitePage("view-tasks")}> view tasks </div>
                    </Dropdown>
                    <button type="button" className="refresh-btn" onClick={() => handleRefresh(false)} > <i className="fa fa-refresh" aria-hidden="true"></i> </button>
                    <Dropdown buttonContent={<i className="fa fa-filter" aria-hidden="true"></i>}>
                        <div> by project </div>
                        <div> by objective</div>
                        <div> by task </div>
                    </Dropdown>
                </div>

            </div>

            <div className="homepage-body"> 
                <div className="timeslots"> </div>
                <ol id="task-list" className="task-list">
                    {tasks.length==0? null:tasks.map((task)=> 
                        <li align="left" key={task.id}>
                            <TaskCard task={task} handleDeleteEntity={handleDeleteEntity}/>
                        </li>
                    )}
                </ol>
            </div>

        </div>
    )
}

export default HomePage