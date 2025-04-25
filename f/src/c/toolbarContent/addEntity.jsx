import Dropdown from "../dropdown"
import globalContext from "../../context"
import { useContext } from "react"

function AddEntity() {
    const { setForm, setIsModalOpen } = useContext(globalContext)
    const handleCreateContent = (content) => {
        setForm(`create-${content}`)
        setIsModalOpen(true)
    }
    return (
        <Dropdown buttonContent={<i className="fa fa-plus" aria-hidden="true"></i>} translate={"0% 52%"}>
            <div onClick={() => handleCreateContent("task")}> Create Task</div>
            <div onClick={() => handleCreateContent("objective")}> Create Objective</div>
            <div onClick={() => handleCreateContent("project")}> Create Project</div>
        </Dropdown>
    )
}

export default AddEntity