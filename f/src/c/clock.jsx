import { useState, useEffect } from "react"

const Clock = () => {
  const [time, setTime] = useState(new Date())

  // Update the time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date())
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

  return (
      <div className="clock">{fromatDate(time)} | {formatTime(time)}</div>
  )
}

export default Clock