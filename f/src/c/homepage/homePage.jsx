import "./homePage.css"
import { useContext} from "react"
import { useQuery } from "@tanstack/react-query"
import globalContext from "../../context"
import TaskCard from "./taskCard"
import Header from "../header/header"
import ToolBar from "../toolbar/toolbar"
import TimeslotCards from "./timeslotCards"
import AddEntity from "../toolbar/addEntity"
import FilterPage from "../toolbar/filterPage" 
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import TimerLine from "./timerLine"
import homepageTasksQueryOptions from "../../queryOptions/readHomepageTasksQueryOption"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todaysDate = new Date().toDateString()
function HomePage ({isLoggedIn, sitePage}) {

    if (!isLoggedIn || sitePage!=="view-homepage") {
        return null
    }
    const {currentDate, userSettings, handleDayNavigation, handleNotification, handleLogout} = useContext(globalContext)
    const currentDay = daysOfWeek[new Date(currentDate).getDay()]
    const selectedDate = new Date(currentDate).toISOString().split("T")[0]
    const { isPending, data, refetch } = useQuery( homepageTasksQueryOptions(selectedDate, handleNotification, handleLogout) )

    if (isPending) return "Loading ..."
    const homePageTasks = data.tasks

    // change the colour of (the text of) the day if it is not today's date
    const todayIndicator = () => todaysDate === new Date(currentDate).toDateString()? "rgb(0, 230, 0)" : "red"

    return (
        <div className="homepage">
            <div  className="homepage-header"> 
                <div className="homepage-header-row1">
                    <Header/>
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
                        <RefreshEntities refetch={refetch}/>
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