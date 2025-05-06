import "./hoverText.css"
import { useContext } from "react"
import globalContext from "../../context"

const HoverText = ({width}) => {
    const {hoverText, isShowHoverText} = useContext(globalContext)
    return (
        <div style = {{"visible":isShowHoverText?true:false, "width":width}} className="hover-text" >
            {hoverText}
        </div>
    )
}

export default HoverText