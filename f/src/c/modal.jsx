import "./modal.css"
import { useEffect, useContext } from "react"
import globalContext from "../context.js"
import { defaultTask, defaultObjective, defaultProject } from '../staticVariables.js'

function Modal ({children}) {
    const {isModalOpen, setIsModalOpen, setForm, setCurrentTask, setCurrentObjective, setCurrentProject, setShowProjectQueryResult, setShowObjectiveQueryResult} = useContext(globalContext)
    if (!isModalOpen) {
        return null
    }

    const handleClickCloseBtn= () => {
        setIsModalOpen(false)
        setForm("")
        setCurrentTask(defaultTask)
        setCurrentObjective(defaultObjective)
        setCurrentProject(defaultProject)
        setShowProjectQueryResult(false)
        setShowObjectiveQueryResult(false)
    }

    const handleClickModalOverlay= () => {
        setIsModalOpen(false)
        setForm("")
        setShowProjectQueryResult(false)
        setShowObjectiveQueryResult(false)
    }

    return (
        <div className="modal-overlay" onDoubleClick={handleClickModalOverlay} >
            <div className="modal-content" onClick={(e)=>e.stopPropagation()}> 
                <button className="modal-close-btn" onClick={()=>handleClickCloseBtn()}>&times;</button>
                {children}
            </div>
        </div>
    )
}

export default Modal

/* e.stopPropagation Explained:
    - tags have individual events (e.g., click) and event handlers (e.g. onClick, i.e., defines the action to do on click e.g., close tag). 
    - i.e., clicking a descendant element is the same as clicking its parents, grandparent etc. This triggers the event handler of the ancestor (if the ancestor has an onClick event handler)
    - By default events in the child tags "propagate up" to its parent elements
    - Using e.stopPropagation on a parent elements stops the event of child elements from triggering the parent's event handler

*/

