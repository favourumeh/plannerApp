import "./modal.css"
import { useState, useContext } from "react"
import globalContext from "../context.js"

function Modal ({children}) {
    const {isModalOpen, setIsModalOpen, setClientAction, setCurrentTask, setCurrentObjective, setCurrentProject} = useContext(globalContext)

    if (!isModalOpen) {
        return null
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setClientAction("")
        setCurrentTask({isCompleted:false, isRecurring:false, priorityScore:1})
        setCurrentProject({})
        setCurrentObjective({})
    }

    return (
        <div className="modal-overlay" onClick={handleModalClose} >
            <div className="modal-content" onClick={(e)=>e.stopPropagation()}> 
                <button className="modal-close-btn" onClick={()=>handleModalClose()}>&times;</button>
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

