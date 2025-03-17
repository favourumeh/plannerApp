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
        setIsModalOpen, tasks, fetchAllContent} = useContext(globalContext)

    if (!isLoggedIn) {
        return null
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
    
    const onCreateTask = async () => {
        url = `${backendBaseUrl}/create-Task`
        body = {
            "description":"created user1 task", 
            "duration":20, 
            "priorityScore":2,
            "scheduledStart":now_str, 
            "scheduledFinish":now_str, 
            "isCompleted":True,
            "previousTaskId":2, 
            "nextTaskId":4, 
            "isRecurring":True, 
            "dependencies":"1,2",
            "tag":"test", 
            "objectiveId":user1_objective_id

        }
        // options = {
        //     method:"post",
        //     headers:{"content-type":"application/json"},
        //     body:
        // }
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
            handleNotification(resp_json.message, "failure")
        }

    }

    const handleRefresh = async (hideNoti=true) => {
        try {
            fetchAllContent()
            hideNoti || handleNotification("User content refreshed", "success")
        } catch {
            handleNotification("Could not refresh User Content", "failure")
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
                        <div> Create Task</div>
                        <div> Create Objective</div>
                        <div> Create Project</div>
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