import { useState, useEffect, useContext } from "react"
import globalContext from "../context"

const Clock = () => {
    const [todayDateTime, setTodayDateTime] = useState(new Date())
    const {currentDate, setCurrentDate, sitePage} = useContext(globalContext)
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

    useEffect(() => {
        if (sitePage !== "view-homepage") {
            setCurrentDate(new Date())
        }
    }, [sitePage])
  return (
      <div className="clock"> <span style={{color:todayIndicator()}}>{fromatDate(new Date(currentDate))} </span>| {formatTime(todayDateTime)}</div>
  )
}

export default Clock