import "./homePage.css"
import { useContext, useEffect} from "react"
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
import { homepageTasksQueryOptions } from "../../queryOptions"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const todaysDate = new Date().toDateString()
function HomePage ({isLoggedIn, sitePage}) {

    if (!isLoggedIn || sitePage!=="view-homepage") {
        return null
    }
    const {currentDate, userSettings, handleDayNavigation, handleNotification, handleLogout, isModalOpen} = useContext(globalContext)
    const currentDay = daysOfWeek[new Date(currentDate).getDay()]
    const selectedDate = new Date(currentDate).toISOString().split("T")[0]
    const { isPending, data, refetch:refetchHomePageTasks } = useQuery( homepageTasksQueryOptions(selectedDate, handleNotification, handleLogout) )
    const userDayStart = new Date(currentDate).setHours(userSettings["dayStartTime"].split(":")[0], userSettings["dayStartTime"].split(":")[1], 0, 0) - new Date().getTimezoneOffset()*60*1000 // in milliseconds
    const userDayEnd = new Date(currentDate).setHours(userSettings["dayEndTime"].split(":")[0], userSettings["dayEndTime"].split(":")[1], 0, 0) - new Date().getTimezoneOffset()*60*1000 // in milliseconds

    useEffect(() => {// refetchHomePageTasks after exiting an entity form
        if (!isModalOpen) {
            refetchHomePageTasks()
        }
    }, [isModalOpen])

    const homePageTasksResponse = isPending? [] : data
    const homePageTasks = homePageTasksResponse.tasks
    const projects = homePageTasksResponse.taskProjects
    const objectives = homePageTasksResponse.taskObjectives

    const earliestTaskStart = homePageTasks?.reduce((earliest, task) => {
        const taskStart = new Date(task.start).getTime()
        return (taskStart < earliest ? taskStart : earliest)
    }, userDayStart)

    const latestTaskFinish = homePageTasks?.reduce((latest, task) => {
        const timezoneOffset = new Date().getTimezoneOffset()*60*1000 // in milliseconds
        const taskFinish = !!task.finish?  new Date(task.finish).getTime()  - timezoneOffset : new Date(task.start).getTime() + task.durationEst*60*1000 - timezoneOffset
        return (taskFinish > latest ? taskFinish : latest)
    }, userDayEnd)

    const dayStartDT = earliestTaskStart < userDayStart ? earliestTaskStart : userDayStart
    const dayEndDT = latestTaskFinish > userDayEnd ? latestTaskFinish : userDayEnd

    // console.log("dayStartDT",new Date(dayStartDT), "dayEndDT", new Date(dayEndDT))
    // change the colour of (the text of) the day if it is not today's date
    const todayIndicator = () => todaysDate === new Date(currentDate).toDateString()? "rgb(0, 230, 0)" : "red"

    const indicatePageLoad = () => {
        return isPending? <i className="fa fa-spinner" aria-hidden="true"></i> : undefined
    }
    return (
        <div className="homepage">
            <div  className="homepage-header"> 
                <div className="homepage-header-row1">
                    <Header/>
                </div>

                <div className="homepage-header-row2">
                    <button type="button" className="yesterday-btn" onClick={() => handleDayNavigation("previous-day")}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <strong> <span className="homepage-day" style={{"color":todayIndicator()}}>{currentDay}'s</span> Tasks {indicatePageLoad()} </strong>
                    <button type="button" className="tomorrow-btn" onClick={() => handleDayNavigation("next-day")} > <i className="fa fa-arrow-right" aria-hidden="true"> </i> </button>
                </div>

                <div className="homepage-header-row3">
                    <ToolBar> 
                        <AddEntity/>
                        <ViewPage/>
                        <RefreshEntities refetch={refetchHomePageTasks}/>
                        <FilterPage/>
                    </ToolBar>
                </div>
            </div>
            <div style={{"position":"relative"}} className="homepage-body"> 
                <TimerLine dayStartDT={dayStartDT} dayEndDT={dayEndDT}/>
                <TimeslotCards dayStartDT={dayStartDT} dayEndDT={dayEndDT} timeIntervalInMinutes={userSettings["timeIntervalInMinutes"]} />
                <div style={{"position":"relative"}} className="task-card-overlay">
                    {homePageTasks?.map((task)=> <TaskCard key={task.id} task={task} projects={projects} objectives={objectives} refetchHomePageTasks={refetchHomePageTasks} dayStartDT={dayStartDT}/>)}
                </div>

            </div>

        </div>
    )
}

export default HomePage