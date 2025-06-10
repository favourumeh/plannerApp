
import {TaskCard} from "./taskCard"
import "./dateCard.css"
import { useEffect, useState } from "react"

const datetimeToString = (datetime) => {
    return !datetime? null : datetime.toISOString().split("T")[0] 
}
export function DateCard({date, tasks, projects, objectives, refetchScheduledTasks}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const daysTasks = tasks?.filter((task) => datetimeToString(new Date(task.scheduledStart)) === date.split(" ")[1])
    // useEffect(()=> console.log("date-daysTask", date, daysTasks), [daysTasks])
    const handleExpandedDayCard = ()  => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div id={"date"} className="planner-date-container">
            <div className="planner-date-container-header">
                <div> {date} #{daysTasks.length}</div>
                <div onClick={handleExpandedDayCard}>
                    {isExpanded? 
                        <i className="fa fa-caret-up" aria-hidden="true"></i>
                        : <i className="fa fa-caret-down" aria-hidden="true"></i>
                    }
                </div>
            </div>

            {isExpanded? 
                daysTasks?.map((task, index) =>
                    <TaskCard key={index} task={task} projects={projects} objectives={objectives} refetchScheduledTasks={refetchScheduledTasks}/>
                )
                : undefined    
            }
        </div>
    )

}