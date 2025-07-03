import "./clock.css"
import { useState, useEffect, useContext } from "react"
import globalContext from "../../context"
import DatePicker from "react-datepicker"
import { datetimeToString } from "../../utils/dateUtilis"

const Clock = () => {
    const [ todayDateTime, setTodayDateTime ] = useState(new Date())
    const { currentDate, setCurrentDate } = useContext(globalContext)
    // Update the time every second
    useEffect(() => {
        const intervalId = setInterval(() => {
            setTodayDateTime(new Date())
        }, 1000)

        // Cleanup the interval on component unmount
        return () => clearInterval(intervalId)
    }, [])

    // Format the time as a string (e.g., "12:34:56 PM")
    const formatTime = (date) => {
        return date.toLocaleTimeString()
    }

    const fromatDate = (date) => {
        return date.toJSON().slice(0, 10)
    }
    const todayIndicator = () => {
        return todayDateTime.toDateString() === new Date(currentDate).toDateString()? "white" : "red"
    } 

    return (
        <div 
            className="clock"
        > 
            <span style={{color:todayIndicator()}} className="date"
            >
            <DatePicker
                selected={new Date(currentDate)}
                onSelect={ (date) => setCurrentDate(datetimeToString(date)) } 
                onChange={ (date) => setCurrentDate(datetimeToString(date)) }
                dateFormat="yyyy-MM-dd"
            />
                {/* {fromatDate(new Date(currentDate))}   */}
            </span> |
            <span 
                className="time"
                onClick={()=> setCurrentDate(new Date)}
            >
                {` ${formatTime(todayDateTime)}`}
            </span>
        </div>
    )
}

export default Clock