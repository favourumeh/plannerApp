import "./hoverText.css"
import { useState } from 'react';

const HoverText = ({text, isShowText}) => {
    return (
        <div style = {{"visible":isShowText?true:false}}className="hover-text" >
            {text}
        </div>
    )
}

export default HoverText