import "./homePage.css"
import { useState, useContext, useEffect } from "react"
import globalContext from "../context"
import TaskCard from "./taskCard"
import Dropdown from "./Dropdown"
import Header from "./header"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todaysDate = new Date().toDateString()
function HomePage ({isLoggedIn, sitePage, homePageTasks, setHomePageTasks}) {

    if (!isLoggedIn || sitePage!=="view-homepage") {
        return null
    }

    const {currentDate, setCurrentDate, setSitePage, setForm, handleDeleteEntity, setIsModalOpen, tasks, objectives, projects, handleRefresh} = useContext(globalContext)
    const [currentDay, setCurrentDay] = useState(null)

    useEffect(() => {setCurrentDay(daysOfWeek[new Date(currentDate).getDay()])}, [currentDate])

   useEffect(() => {
        setHomePageTasks(tasks.filter(task => new Date(task.scheduledStart).toDateString() ===  new Date(currentDate).toDateString()))
    }, [currentDate, tasks, objectives, projects])

    const handleCreateContent = (content) => {
        setForm(`create-${content}`)
        setIsModalOpen(true)
    }

    const handleDayNavigation = (direction) => {
        switch (direction) {
            case "previous-day":
                setCurrentDate(new Date(new Date(currentDate).setDate(new Date(currentDate).getDate() - 1)))
                break
            case "next-day":
                setCurrentDate(new Date(new Date(currentDate).setDate(new Date(currentDate).getDate() + 1)))
                break
        }
    }

    const todayIndicator = () => {
        return todaysDate === new Date(currentDate).toDateString()? "rgb(0, 230, 0)" : "red"
    }

    return (
        <div className="homepage">
            <div className="homepage-header"> 
                <div className="homepage-header-row1">
                    <Header setCurrentDate={setCurrentDate}/>
                </div>

                <div className="homepage-header-row2">
                    <button type="button" className="yesterday-btn" onClick={() => handleDayNavigation("previous-day")}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <strong> <span className="homepage-day" style={{"color":todayIndicator()}}>{currentDay}'s</span> Tasks </strong>
                    <button type="button" className="tomorrow-btn" onClick={() => handleDayNavigation("next-day")} > <i className="fa fa-arrow-right" aria-hidden="true"> </i> </button>
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
                    {homePageTasks.length==0? null:homePageTasks.map((task)=> 
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