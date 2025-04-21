import './taskInfoCard.css'
import InfoCard from './infoCard'
import globalContext from '../../context'
import { useContext } from 'react'

const ProjectInfoCard = ({project, translate}) => {
    const {formatDateFields} = useContext(globalContext)
    project = formatDateFields(project)
    return (
            <InfoCard translate={translate}>
                <div className='info-card-item info-card-project-title'><span>Desc:</span> {project.title}</div>
                <div className='info-card-item info-card-project-description'><span>Desc:</span> {project.description}</div>
                <div className='info-card-item info-card-project-dealine'><span>Finish:</span> {project.deadline}</div>
            </InfoCard>
    )
}

export default ProjectInfoCard