import "./entityPage.css"
import { useContext, useEffect, useState } from "react"
import globalContext from "../../context"
import {useQuery, keepPreviousData} from "@tanstack/react-query"
import Header from "../header/header"
import EntityCard from "./entityCard"
import ToolBar from "../toolbar/toolbar"
import AddEntity from "../toolbar/addEntity"
import FilterPage from "../toolbar/filterPage" 
import ViewPage from "../toolbar/viewPage"
import RefreshEntities from "../toolbar/refreshEntities"
import { fetchUserEntityPage } from "../../fetch_entities"
import Dropdown from "../dropdown"

function EntityPage ({sitePage}) {
    if (sitePage != "view-entity") return null
    const [page, setPage] = useState(1)
    const {handleNotification, handleLogout,isModalOpen} = useContext(globalContext)
    const [entityName, setEntityName] = useState("project")

    const { isPending, data, refetch: refetchEntityPageContent } = useQuery({
        queryKey: [`${entityName}s`, page],
        queryFn: () => fetchUserEntityPage(entityName, handleNotification, handleLogout, page),
        placeholderData: keepPreviousData,
        retry: 3,
    })

    useEffect(() => { //refetch the entityPage's content when the create/edit entity form modal is closed
        if (!isModalOpen && !isPending) {
            refetchEntityPageContent()
        }
    }, [isModalOpen])

    const entityPageData = isPending ? [] : data
    const  entityArr = entityName==="project"? entityPageData?.projects : entityName==="objective" ? entityPageData?.objectives : entityPageData?.tasks 
    const  projects = entityName==="task"? entityPageData?.taskProjects : entityName==="objective"? entityPageData?.objectivesProjects : [] 
    const  objectives = entityName==="task"? entityPageData?.taskObjectives: []

    const onClickNextPage = () => {
        if (page>=entityPageData["_pages"]) return
        setPage(page+1)
    }

    const onClickPrevPage = () => {
        if (page<=1) return
        setPage(page-1)
    }

    const dropdownButton = () =>{
        return (
            <>
                {entityName.toUpperCase()}S &nbsp;&nbsp;
                <i className={`fa fa-caret-down side-btn`} aria-hidden="true"></i> &nbsp;
                ({`${page}/${ !!entityPageData._pages ? Math.max(entityPageData._pages, 1) : 1} `})
            </>
        )
    }

    const indicatePageLoad = () => {
        return isPending? <i className="fa fa-spinner" aria-hidden="true"></i> : undefined
    }
    return (
        <div className="entity-page">
            <div className="entity-page-header"> 
                <div className="entity-page-header-row1">
                    <Header/>
                </div>

                <div className="entity-page-header-row2">
                    <button type="button" className="next-pg-btn" onClick={onClickPrevPage}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <Dropdown 
                        buttonContent={ dropdownButton() } 
                        buttonClassName={"entity-dropdown"}
                        translate={"0px 40px"}
                        >
                        <div onClick={ () => {setEntityName("project"); setPage(1);} }> Projects </div>
                        <div onClick={ () => {setEntityName("objective"); setPage(1);} }> Objectives </div>
                        <div onClick={ () => {setEntityName("task"); setPage(1);} }> Tasks </div>
                    </Dropdown> 
                    {indicatePageLoad()}
                    <button type="button" className="prev-pg-btn" onClick={onClickNextPage}> <i className="fa fa-arrow-right" aria-hidden="true"></i> </button>
                </div>
                
                <div className="entity-page-header-row3">
                    <ToolBar> 
                        <AddEntity/>
                        <ViewPage/>
                        <RefreshEntities refetch={refetchEntityPageContent}/>
                        <FilterPage/>
                    </ToolBar>
                </div>
            </div>

            <div className="entity-page-body"> 
                    {entityArr?.map((entity)=> 
                        <div align="left" key={entity.id}>
                            <EntityCard entity={entity} entityName={entityName} projects={projects} objectives={objectives} refetchEntityPageContent = {refetchEntityPageContent}/>
                        </div>
                    )}
            </div>

        </div>
    )
}
export default EntityPage