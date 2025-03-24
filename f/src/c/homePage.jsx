import "./homePage.css"
import { useState, useContext, useEffect } from "react"
import globalContext from "../context"
import { backendBaseUrl } from "../project_config"
import Clock from "./clock"
import TaskCard from "./taskCard"
import Dropdown from "./Dropdown"
import Header from "./header"

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
            const resp_ref = await fetch(`${backendBaseUrl}/refresh`, {"credentials":"include"})
            const resp_ref_json = await resp_ref.json()

            if (resp_ref.status !=200) {
                console.log(resp_ref_json.message)
                handleLogout()
                handleNotification(resp_ref_json.message, "failure")
            } else {
                console.log(resp_ref_json.message)
                handleDeleteTask(e, id)
            }
        }

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
                    <Dropdown buttonContent={<i class="fa fa-eye" aria-hidden="true"></i>}>
                        <div> view projects </div>
                        <div> view objectives </div>
                        <div> view tasks </div>
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