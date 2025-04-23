import './taskInfoCard.css'
import InfoCard from './infoCard'
import globalContext from '../../context'
import { useContext } from 'react'

const TaskInfoCard = ({task, translate, taskObjective, taskProject}) => {
    const {formatDateFields} = useContext(globalContext)

    task = formatDateFields(task)

    const formatTaskStart = () => {
        if (!task.start) return task.start
        return `${task.start.split("T")[1]} (${task.start.split("T")[0]})`
    }
    const formatTaskFinish = () => {
        //no finish and start
        if (!task.finish && !task.start) return task.finish
        //no finish but start => calulate estimated finish
        if (!task.finish && !!task.start){ 
            const start = new Date(task.start)
            const tzOffsetMS = start.getTimezoneOffset()*60*1000
            const finish = new Date( start.getTime() - tzOffsetMS + task.durationEst*60*1000) // (currentTz +/- offset ) added timezone offset to put finish a hour ahead actual finish time in the current tz
            const formatted_finish = finish?.toISOString().replace(/:\d{2}\.\d{3}Z$/, '') // (currentTz +/- offset -/+offset )  toISOString converts the date to UTC (so for BTS: minus 1hr which is in BTS))
            return `${formatted_finish.split("T")[1]} (${formatted_finish.split("T")[0]})`
        }
        //finish
        return `${task.finish.split("T")[1]} (${task.finish.split("T")[0]})`


    }

    return (
            <InfoCard translate={translate}>
                <div className='info-card-item info-card-task-project-title'><span>Project Title:</span> {taskProject.title}</div>
                <div className='info-card-item info-card-task-objective-title'><span>Objective Title:</span> {taskObjective.title}</div>
                <div className='info-card-item info-card-task-status'><span>Status:</span> {task.status}</div>
                <div className='info-card-item info-card-task-description'><span>Desc:</span> {task.description}</div>
                <div className='info-card-item info-card-task-scheduled-date'><span>Scheduled Start:</span> {task.scheduledStart}</div>
                <div className='info-card-item info-card-task-duration-est'><span>Duration (est):</span> {task.durationEst}mins</div>
                <div className='info-card-item info-card-task-duration'><span>Duration:</span> {task.duration}mins</div>
                <div className='info-card-item info-card-task-start'><span> Start:</span> {formatTaskStart()}</div>
                <div className='info-card-item info-card-task-finish'><span>Finish:</span> {formatTaskFinish()}</div>
            </InfoCard>
    )
}

export default TaskInfoCard