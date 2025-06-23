
import {TaskCard} from "./taskCard"
import "./dateCard.css"
import { useEffect, useState } from "react"
import { useDroppable } from "@dnd-kit/core"

const datetimeToString = (datetime) => {
    return !datetime? null : datetime.toISOString().split("T")[0] 
}
export function DateCard({date, isPendingScheduled, tasks, projects, objectives, isExpandAll, refetchScheduledTasks}) {
    const [isExpanded, setIsExpanded] = useState(isExpandAll)

    const taskFilter = (task) => {
        if (!!task.start){
            return (datetimeToString(new Date(task.start)) === date.split(" ")[1])
        }
        return (datetimeToString(new Date(task.scheduledStart)) === date.split(" ")[1])
    }
    const daysTasks = tasks?.filter(taskFilter)
    const totalTaskMins = daysTasks.reduce((acc, task)=> acc + (task.duration || task.durationEst), 0)

    const handleExpandedDayCard = ()  => {
        setIsExpanded(!isExpanded)
    }
    const {setNodeRef} = useDroppable({ id: date }) //dnd

    useEffect(() => {
        if (!isExpanded){ // expand dateCard to show tasks if dateCard is constricted when the number of dayTasks changes. 
            setIsExpanded(true)
        }

        if (daysTasks.length===0) { // constrict datecard when there are no tasks scheduled for date
            setIsExpanded(false)
        }
    }, [daysTasks.length])

    useEffect(()=> { // expand/constrict all date cards
        setIsExpanded(isExpandAll)
    }, [isExpandAll])

    const styleDateCardTitle = {color: daysTasks.length === 0? "red" : "white"}
    const styleDateCard = {border:  + ( datetimeToString(new Date()) == datetimeToString(new Date(date.split(" ")[1])) )? "2px solid rgb(0,230,0)" : "1px solid" }
    const displayedTaskDuration = () => {
        if (totalTaskMins < 60) {
            return `${totalTaskMins}mins`
        } else {
            const totalTaskHours = totalTaskMins/60
            const minRemainder = Math.abs(Math.round(60*(Math.floor(totalTaskHours) - totalTaskHours)))
            return `${Math.floor(totalTaskMins/60)}hrs ${minRemainder}mins`
        }
    }

    return (
        <div ref={setNodeRef} id={date} className="planner-date-container" style={styleDateCard}>
            <div className="planner-date-container-header" >
                <div className="date-card-title" style={styleDateCardTitle}> {date} #{isPendingScheduled? "..." : daysTasks.length } ({displayedTaskDuration()})</div>
                <div onClick={handleExpandedDayCard}>
                    {isExpanded? 
                        <i className="fa fa-caret-up" aria-hidden="true"></i>
                        : <i className="fa fa-caret-down" aria-hidden="true"></i>
                    }
                </div>
            </div>

            {isExpanded? 
                daysTasks?.map((task, index) =>
                    <TaskCard key={index} task={task} projects={projects} objectives={objectives} refetchScheduledTasks={refetchScheduledTasks} translate={"50% 25px"}/>
                )
                : undefined    
            }
        </div>
    )

}