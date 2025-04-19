import "./progressCard.css"
import globalContext from "../../context"
import { useContext } from "react"

import ProgressCard from "./progressCard"
import Toolbar from "../toolbar"
import AddEntity from "../toolbarContent/addEntity"
import ViewPage from "../toolbarContent/viewPage"
import RefreshEntities from "../toolbarContent/refreshEntities"
import FilterPage from "../toolbarContent/filterPage"
import Header from "../header"

export default function ProgressPage ({sitePage}) {
    if (sitePage!=="view-progress") return
    const {tasks, objectives, projects} = useContext(globalContext)


    const getProjectObjectives = (projectId) => {
        return objectives.filter(objective => objective.projectId === projectId)
    }
    const getObjectiveTasks = (objectiveId) => {
        return tasks.filter(task => task.objectiveId == objectiveId)
    }
    return (

        <div className="progress-page">
            <div className="entity-page-header"> 
                <div className="entity-page-header-row1">
                    <Header/>
                </div>

                <div className="entity-page-header-row2">
                    <strong> Progress </strong>
                </div>
                
                <div className="entity-page-header-row3">
                    <Toolbar> 
                        <AddEntity/>
                        <ViewPage/>
                        <RefreshEntities/>
                        <FilterPage/>
                    </Toolbar>
                </div>
            </div>

            <div className="progress-page-body">
                {projects?.map((project) =>
                    <ProgressCard key={project.id} entity={project} entityName="project">
                        {getProjectObjectives(project.id)?.map( (objective) => 
                            <ProgressCard key={objective.id} entity={objective} entityName="objective">
                                {getObjectiveTasks(objective.id)?.map( (task) => 
                                    <ProgressCard key={task.id} entity={task} entityName="task"/> )
                                }
                            </ProgressCard> 
                        )}
                    </ProgressCard>
                )
                }
            </div>
        </div>

        )

}
