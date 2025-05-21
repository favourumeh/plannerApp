import "./searchResult.css"
import { useState, useEffect, useContext} from "react";
import globalContext from "../../context";

function SearchResult({searchFieldLabel, query, setQuery, entityArray}) {
    /*Queries a field ["title"] of an array of objects [entityArray] and returns the object(s) from the array that match the query*/
    const {showProjectQueryResult, showObjectiveQueryResult} = useContext(globalContext)

    const [queryResults, setQueryResult] =  useState()
    useEffect(()=> {
        var result = entityArray.filter((item) => 
                        item["title"]?.toLowerCase().includes(query?.toLowerCase()) || 
                        item["title"]== (searchFieldLabel == "Project"?"No Project":"No Objective")).slice(0,5)

        if (query==="" || typeof query==="undefined") {
            result = entityArray.slice(0,5)
        }
        setQueryResult(result)}, [query, showProjectQueryResult, showObjectiveQueryResult])

    if (!showProjectQueryResult && searchFieldLabel=="Project") {
        return null
    }
    if (!showObjectiveQueryResult && searchFieldLabel=="Objective") {
        return null
    }

    const onResultClick = (result) => {
        setQuery(result.title)    
    }

    return (
        <div className="query-result-overlay">
            <ol className="query-result-list">
                {queryResults.map((result) => 
                    <li className="query-result" key={`${searchFieldLabel} - ${result.id}`} onClick={() => onResultClick(result)}>
                        {result[`${searchFieldLabel.toLowerCase()}Number`]} {result["title"]}
                    </li>
                )}
            </ol>
        </div>
    )
}
export default SearchResult