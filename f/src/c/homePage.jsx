import "./homePage.css"
import { useState, useContext, useEffect, useRef } from "react"
import globalContext from "../context"
import TaskCard from "./taskCard"
import Header from "./header"
import ToolBar from "./toolbar"
import TimeslotCards from "./timeslotCards"
import AddEntity from "./toolbarContent/addEntity"
import FilterPage from "./toolbarContent/filterPage" 
import ViewPage from "./toolbarContent/viewPage"
import RefreshEntities from "./toolbarContent/refreshEntities"
import TimerLine from "./timerLine"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todaysDate = new Date().toDateString()
function HomePage ({isLoggedIn, sitePage, homePageTasks, setHomePageTasks}) {

    if (!isLoggedIn || sitePage!=="view-homepage") {
        return null
    }
    const {currentDate, setCurrentDate,  tasks, objectives, projects, userSettings, handleDayNavigation} = useContext(globalContext)
    const currentDay = daysOfWeek[new Date(currentDate).getDay()]

    // filter the tasks to be displayed on the homepage
    useEffect(() => {
        setHomePageTasks(tasks.filter(task => new Date(task.start).toDateString() ===  new Date(currentDate).toDateString()))
    }, [currentDate, tasks, objectives, projects])

    // change the colour of (the text of) the day if it is not today's date
    const todayIndicator = () => todaysDate === new Date(currentDate).toDateString()? "rgb(0, 230, 0)" : "red"

    return (
        <div className="homepage">
            <div  className="homepage-header"> 
                <div className="homepage-header-row1">
                    <Header setCurrentDate={setCurrentDate}/>
                </div>

                <div className="homepage-header-row2">
                    <button type="button" className="yesterday-btn" onClick={() => handleDayNavigation("previous-day")}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <strong> <span className="homepage-day" style={{"color":todayIndicator()}}>{currentDay}'s</span> Tasks </strong>
                    <button type="button" className="tomorrow-btn" onClick={() => handleDayNavigation("next-day")} > <i className="fa fa-arrow-right" aria-hidden="true"> </i> </button>
                </div>

                <div className="homepage-header-row3">
                    <ToolBar> 
                        <AddEntity/>
                        <ViewPage/>
                        <RefreshEntities/>
                        <FilterPage/>
                    </ToolBar>
                </div>
            </div>
            <div style={{"position":"relative"}} className="homepage-body"> 
                <TimerLine/>
                <TimeslotCards dayStart={userSettings["dayStartTime"]} dayEnd={userSettings["dayEndTime"]} timeIntervalInMinutes={userSettings["timeIntervalInMinutes"]}/>
                <div style={{"position":"relative"}} className="task-card-overlay">
                    {homePageTasks?.map((task)=> <TaskCard key={task.id} task={task}/>)}
                </div>

            </div>

        </div>
    )
}

export default HomePage