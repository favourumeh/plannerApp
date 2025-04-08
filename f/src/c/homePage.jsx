import "./homePage.css"
import { useState, useContext, useEffect } from "react"
import globalContext from "../context"
import TaskCard from "./taskCard"
import Header from "./header"
import ToolBar from "./toolbar"
import TimeslotCards from "./timeslotCards"
import AddEntity from "./toolbarContent/addEntity"
import FilterPage from "./toolbarContent/filterPage" 
import ViewPage from "./toolbarContent/viewPage"
import RefreshEntities from "./toolbarContent/refreshEntities"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todaysDate = new Date().toDateString()
function HomePage ({isLoggedIn, sitePage, homePageTasks, setHomePageTasks}) {

    if (!isLoggedIn || sitePage!=="view-homepage") {
        return null
    }

    const {currentDate, setCurrentDate,  handleDeleteEntity, tasks, objectives, projects, userSettings} = useContext(globalContext)
    const [currentDay, setCurrentDay] = useState(null)

    useEffect(() => {setCurrentDay(daysOfWeek[new Date(currentDate).getDay()])}, [currentDate])

   useEffect(() => {
        setHomePageTasks(tasks.filter(task => new Date(task.scheduledStart).toDateString() ===  new Date(currentDate).toDateString()))
    }, [currentDate, tasks, objectives, projects])

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
                    <ToolBar> 
                        <AddEntity/>
                        <ViewPage/>
                        <RefreshEntities/>
                        <FilterPage/>
                    </ToolBar>
                </div>
            </div>

            <div className="homepage-body"> 
                <TimeslotCards dayStart={userSettings["dayStartTime"]} dayEnd={userSettings["dayEndTime"]} timeIntervalInMinutes={userSettings["timeIntervalInMinutes"]}/>
                <ol id="task-list" className="task-list">
                    {homePageTasks?.map((task)=> 
                        <li align="left" key={task.id}>
                            <TaskCard task={task}/>
                        </li>
                    )}
                </ol>
            </div>

        </div>
    )
}

export default HomePage