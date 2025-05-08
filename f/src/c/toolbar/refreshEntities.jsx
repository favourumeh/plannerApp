import globalContext from "../../context"
import { useContext } from "react"

function RefreshEntities({refetch}) {
    //refetch is an output of useQuery
    const { handleRefresh} = useContext(globalContext)
    return (
        <button 
            type="button" 
            className="refresh-btn" 
            onClick={!!refetch ? () => refetch() :  () => handleRefresh(false)}
        >   
            <i className="fa fa-refresh" aria-hidden="true"></i> 
        </button>
    )
}

export default RefreshEntities



