import "./entityPage.css"
import { useContext, useEffect } from "react"
import globalContext from "../context"
import Header from "./header"
import EntityCard from "./EntityCard"
import ToolBar from "./toolbar"

function EntityPage ({sitePage}) {

    if (!["view-projects", "view-objectives", "view-tasks"].includes(sitePage)) {
        return null
    }
    
    const {tasks, projects, objectives, entityName, setEntityName, entity,setEntity} = useContext(globalContext)

    useEffect(() => {
        setEntityName(sitePage==="view-projects"? "project": sitePage==="view-objectives"? "objective":"task")
        setEntity(sitePage==="view-projects"? projects: sitePage==="view-objectives"? objectives:tasks)
    }, [sitePage])

    useEffect(() => {
        setEntity(sitePage==="view-projects"? projects: sitePage==="view-objectives"? objectives:tasks)
    }, [projects, objectives, tasks])

    return (
        <div className="entity-page">
            <div className="entity-page-header"> 
                <div className="entity-page-header-row1">
                    <Header/>
                </div>

                <div className="entity-page-header-row2">
                    <strong> {entityName.toUpperCase()}S </strong>
                </div>
                
                <div className="entity-page-header-row3">
                    <ToolBar />
                </div>
            </div>

            <div className="entity-page-body"> 
                <ol id="entity-list" className="entity-list">
                    {entity.length==0? null:entity.map((item)=> 
                        <li align="left" key={item.id}>
                            <EntityCard entity={item} entityName={entityName}/>
                        </li>
                    )}
                </ol>
            </div>

        </div>
    )
}

export default EntityPage