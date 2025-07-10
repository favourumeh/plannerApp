import './taskInfoCard.css'
import InfoCard from './infoCard'
import globalContext from '../../context'
import { useContext } from 'react'

const ObjectiveInfoCard = ({objective, translate, objectiveProject, progress}) => {
    const {formatDateFields} = useContext(globalContext)
    objective = formatDateFields(objective)
    return (
            <InfoCard translate={translate}>
                <div className='info-card-item info-card-objective-project-title'><span>Project Title:</span> {objectiveProject.title}</div>
                <div className='info-card-item info-card-objective-objective-title'><span>Title:</span> {objective.title}</div>
                <div className='info-card-item info-card-objective-description'><span>Desc:</span> {objective.description}</div>
                <div className='info-card-item info-card-objective-finish'><span>Deadline:</span> {objective.deadline}</div>
                {!!progress? <div className='info-card-item info-card-objective-progress'><span style={{color:"red"}} >Progress:</span> {progress}</div>: undefined }
            </InfoCard>
    )
}

export default ObjectiveInfoCard