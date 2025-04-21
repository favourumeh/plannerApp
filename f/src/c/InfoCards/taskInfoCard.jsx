import './taskInfoCard.css'
import InfoCard from './infoCard'
import globalContext from '../../context'
import { useContext } from 'react'

const TaskInfoCard = ({task, translate, taskObjective, taskProject}) => {
    const {formatDateFields} = useContext(globalContext)

    task = formatDateFields(task)
    const getTaskFinishDate = () => {
        if (!!task.finish){
            return task.finish
        }
        const start = new Date(task.start)
        const tzOffsetMS = start.getTimezoneOffset()*60*1000
        const finish = new Date( start.getTime() - tzOffsetMS + task.duration*60*1000) // (currentTz +/- offset ) added timezone offset to put finish a hour ahead actual finish time in the current tz
        return finish.toISOString().replace(/:\d{2}\.\d{3}Z$/, '') // (currentTz +/- offset -/+offset )  toISOString converts the date to UTC (so for BTS: minus 1hr which is in BTS))
    }

    return (
            <InfoCard translate={translate}>
                <div className='info-card-item info-card-task-project-title'><span>Project Title:</span> {taskProject.title}</div>
                <div className='info-card-item info-card-task-objective-title'><span>Objective Title:</span> {taskObjective.title}</div>
                <div className='info-card-item info-card-task-description'><span>Desc:</span> {task.description}</div>
                <div className='info-card-item info-card-task-scheduled-date'><span>Scheduled Start:</span> {task.scheduledStart}</div>
                <div className='info-card-item info-card-task-duration'><span>Duration:</span> {task.duration}mins</div>
                <div className='info-card-item info-card-task-start'><span> Start:</span> {task.start}</div>
                <div className='info-card-item info-card-task-finish'><span>Finish:</span> {getTaskFinishDate()}</div>
            </InfoCard>
    )
}

export default TaskInfoCard