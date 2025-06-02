import "./progressPage.css"
import globalContext from "../../context"
import { useState, useContext, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import ProjectProgressCard from "./projectProgessCard"
import Toolbar from "../toolbar/toolbar"
import AddEntity from "../toolbar/addEntity"
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import FilterPage from "../toolbar/filterPage"
import Header from "../header/header"
import Dropdown from "../dropdown"
import { readProjectsQueryOption } from "../../queryOptions"

export default function ProgressPage ({sitePage}) {
    if (sitePage!=="view-progress") return
    const {handleNotification, handleLogout, isModalOpen} = useContext(globalContext)
    const [metric, setMetric] = useState("duration") //duration or task-count

    const {data: projectQuery, isPending: isProjectsPending, refetch: refetchProjects} = useQuery(readProjectsQueryOption(false, handleNotification, handleLogout))
    const projects = projectQuery?.projects

    useEffect(() => {
        if (!isModalOpen && !isProjectsPending) {
            refetchProjects()
        }
    }, [isModalOpen, isProjectsPending])

    const refetchProgressPageProjects = () => {
        refetchProjects()
        handleNotification("Projects refetched successfully", "success")
    }

    if (isProjectsPending) return "Loading projects..."
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
                            <RefreshEntities refetch={refetchProgressPageProjects}/>
                            <FilterPage/>
                        </Toolbar>
                    </div>
                </div>
                <div className="progress-page-body">
                    {projects?.map((project) => 
                        <ProjectProgressCard key={project.id} entity={project} entityName="project" metric={metric} refetchProjects={refetchProjects}/> 
                    )}
                </div>
            </div>
        )

}
