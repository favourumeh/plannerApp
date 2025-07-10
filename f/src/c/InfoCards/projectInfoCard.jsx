import './taskInfoCard.css'
import InfoCard from './infoCard'
import globalContext from '../../context'
import { useContext } from 'react'

const ProjectInfoCard = ({project, translate, progress}) => {
    const {formatDateFields} = useContext(globalContext)
    project = formatDateFields(project)
    return (
            <InfoCard translate={translate}>
                <div className='info-card-item info-card-project-title'><span>Title:</span> {project.title}</div>
                <div className='info-card-item info-card-project-description'><span>Desc:</span> {project.description}</div>
                <div className='info-card-item info-card-project-deadline'><span>Deadline:</span> {project.deadline}</div>
                {!!progress? <div className='info-card-item info-card-project-progress'><span style={{color:"red"}} >Progress:</span> {progress}</div>: undefined}
            </InfoCard>
    )
}

export default ProjectInfoCard