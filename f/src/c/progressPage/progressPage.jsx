import "./progressPage.css"
import globalContext from "../../context"
import { useState, useContext } from "react"
import ProgressCard from "./progressCard"
import Toolbar from "../toolbar"
import AddEntity from "../toolbarContent/addEntity"
import ViewPage from "../toolbarContent/viewPage"
import RefreshEntities from "../toolbarContent/refreshEntities"
import FilterPage from "../toolbarContent/filterPage"
import Header from "../header"
import Dropdown from "../dropdown"

export default function ProgressPage ({sitePage}) {
    if (sitePage!=="view-progress") return
    const {tasks, objectives, projects} = useContext(globalContext)
    const [metric, setMetric] = useState("duration") //duration or task-count

    const getProjectObjectives = (projectId) => objectives.filter(objective => objective.projectId === projectId)
    const getObjectiveTasks = (objectiveId) => tasks.filter(task => task.objectiveId == objectiveId)

    return (
            <div className="progress-page">
                <div className="progress-page-header"> 
                    <div className="progress-page-header-row1">
                        <Header/>
                    </div>

                    <div className="progress-page-header-row2">
                        <strong> Progress ({`by ${metric}`})</strong>
                        <Dropdown buttonContent={<i className="fa fa-chevron-down" aria-hidden="true"></i>} translate="0% 80%">
                                <div onClick={() => setMetric("task-count")}>by task count</div>
                                <div onClick={() => setMetric("duration")}>by duration</div>
                        </Dropdown>
                    </div>
                    
                    <div className="progress-page-header-row3">
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
                        <ProgressCard key={project.id} entity={project} entityName="project" metric={metric}>
                            {getProjectObjectives(project.id)?.map( (objective) => 
                                <ProgressCard key={objective.id} entity={objective} entityName="objective" metric={metric}>
                                    {getObjectiveTasks(objective.id)?.map( (task) => 
                                        <ProgressCard key={task.id} entity={task} entityName="task" metric={metric}/> )
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
