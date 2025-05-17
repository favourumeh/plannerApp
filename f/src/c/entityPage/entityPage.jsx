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

function EntityPage ({sitePage}) {
    if (!["view-projects", "view-objectives", "view-tasks"].includes(sitePage)) return null
    const [page, setPage] = useState(1)
    const {handleNotification, handleLogout,isModalOpen} = useContext(globalContext)
    useEffect(() => setPage(1), [sitePage])
    const entityName = sitePage==="view-projects"? "project" : sitePage==="view-objectives"? "objective" : "task"
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

    if (isPending) return "Loading..."

    const  entityArr = sitePage==="view-projects"? data?.projects : sitePage==="view-objectives" ? data?.objectives : data?.tasks 

    const onClickNextPage = () => {
        if (page===data["_pages"]) return
        setPage(page+1)
    }

    const onClickPrevPage = () => {
        if (page===1) return
        setPage(page-1)
    }
    return (
        <div className="entity-page">
            <div className="entity-page-header"> 
                <div className="entity-page-header-row1">
                    <Header/>
                </div>

                <div className="entity-page-header-row2">
                    <button type="button" className="next-pg-btn" onClick={onClickPrevPage}> <i className="fa fa-arrow-left" aria-hidden="true"></i> </button>
                    <strong> {entityName.toUpperCase()}S ({`${page}/${data["_pages"]}`})</strong>
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
                <ol id="entity-list" className="entity-list">
                    {entityArr?.map((entity)=> 
                        <li align="left" key={entity.id}>
                            <EntityCard entity={entity} entityName={entityName} refetchEntityPageContent = {refetchEntityPageContent}/>
                        </li>
                    )}
                </ol>
            </div>

        </div>
    )
}
export default EntityPage