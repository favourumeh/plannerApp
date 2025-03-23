import "./homePage.css"
import { useState, useContext, useEffect } from "react"
import globalContext from "../context"
import { backendBaseUrl } from "../project_config"
import Clock from "./clock"
import TaskCard from "./taskCard"
import Dropdown from "./Dropdown"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let current_date = new Date()
let currentDay = daysOfWeek[current_date.getDay()]

function HomePage ({isLoggedIn}) {
    const {
        clientAction, setClientAction, 
        handleNotification, handleLogout, 
        setIsModalOpen, tasks, handleRefresh} = useContext(globalContext)

    if (!isLoggedIn) {
        return null
    }

    const handleCreateContent = (content) => {
        setClientAction(`create-${content}`)
        setIsModalOpen(true)
    }

    const onLogout = async() => {
        const url = `${backendBaseUrl}/logout`
        const options = {
            method:"GET",
            headers:{"Content-Type":"application/json"},
            credentials:"include"
        }
        const resp = await fetch(url, options)
        const resp_json = await resp.json() 

        if (resp.status == 200) {
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
            handleLogout()
        }else {
            console.log(resp_json.message)
            handleLogout()

        }
    }

    const handleDeleteTask = async (e, id) => {
        e.preventDefault()

        const url = `${backendBaseUrl}/delete-task/${id}`
        const options = {
            method:"DELETE",
            headers:{"content-type":"application/json"},
            credentials:"include"
        }
        const resp = await fetch(url,options)
        const resp_json = await resp.json()

        if (resp.status==200){
            console.log(resp_json.message)
            handleNotification(resp_json.message, "success")
            handleRefresh()
        } else {
            console.log(resp_json.message)
            handleNotification(resp_json.message, "failure")
        }

    }

    return (
        <div className="homepage">
            <div className="homepage-header"> 
                <div className="homepage-header-row1">
                    <div className="clock-overlay">
                        <button type="button" className="settings-btn" > <i className="fa fa-bars" aria-hidden="true"></i> </button>
                        Task Manager <Clock/>
                        <button type="button" className="logout-btn" onClick={onLogout}> Logout </button>
                    </div>
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
                            <TaskCard task={task} handleDeleteTask={handleDeleteTask}/>
                        </li>
                    )}
                </ol>
            </div>

        </div>
    )
}

export default HomePage