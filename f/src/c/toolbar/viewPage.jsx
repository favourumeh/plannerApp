import Dropdown from "../dropdown"
import globalContext from "../../context"
import { useContext } from "react"

function ViewPage() {
    const { sitePage, setSitePage} = useContext(globalContext);    
    const onClickViewEntity = () => {
        setSitePage("view-entity")
    }
    const onClickViewKanban = () => {
        setSitePage("view-kanban")
    }
    const onClickViewProgress = () => {
        setSitePage("view-progress")
    }
    const onClickViewPlanner = () => {
        setSitePage("view-planner")
    }

    return (
        <Dropdown buttonContent={<i className="fa fa-eye" aria-hidden="true"></i>} translate={"0px 40px"}>
            {sitePage=="view-entity"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewEntity}> view entities </div>}
            {sitePage=="view-kanban"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewKanban}> view kanban </div>}
            {sitePage=="view-progress"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewProgress}> view progress </div>}
            {sitePage=="view-planner"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewPlanner}> view planner </div>}

        </Dropdown>
    )
}

export default ViewPage