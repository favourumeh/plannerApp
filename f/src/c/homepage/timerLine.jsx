import "./timerLine.css"
import {useState, useEffect} from 'react'

const TimerLine = ({dayStartDT, dayEndDT}) => {
    const currentDateStr = new Date().toDateString()
    const startOfDay =  new Date(currentDateStr + " " + new Date(dayStartDT).toLocaleTimeString()).getTime() 
    const endOfDay =  new Date(currentDateStr + " " + new Date(dayEndDT).toLocaleTimeString()).getTime() 
    
    if (new Date().getTime() < startOfDay || new Date().getTime() > endOfDay) return 

    const [currentDateTime, setCurrentDateTime] = useState(new Date())
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDateTime(new Date())
        }, 1000)
        return () => clearInterval(intervalId)
    })

    const getTimerLinePosition = () => {
        const elapsedTimeMS = currentDateTime.getTime()  - startOfDay // adjust for timezone
        const elapsedTimeMins = elapsedTimeMS / (60*1000)
        const pixelsPerMinute = 15/10 // (15px for 10 mins)
        const halfTimerLineContainerHeight = 12
        const postion = elapsedTimeMins*pixelsPerMinute - halfTimerLineContainerHeight
        return String(postion)
    }

    const timerContinerStyle = {"top": getTimerLinePosition() + "px"}

    return (
        <div style={timerContinerStyle} className='timer-line-container'>
            <div className="timer-line-caret"><i className="fa fa-caret-right" aria-hidden="true"></i></div>
            <div className="timer-line"></div>
            <div className="timer-line-caret"><i className="fa fa-caret-left" aria-hidden="true"></i></div>
        </div>
    );
};

export default TimerLine;