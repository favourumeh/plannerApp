import globalContext from "../../context"
import { useContext } from "react"

function RefreshEntities() {
    const { handleRefresh} = useContext(globalContext)
    return (
        <button 
            type="button" 
            className="refresh-btn" 
            onClick={() => handleRefresh(false)}
        >   
            <i className="fa fa-refresh" aria-hidden="true"></i> 
        </button>
    )
}

export default RefreshEntities



