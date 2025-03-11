import React, { useState, useEffect } from "react"

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

  return (
      <strong className="clock">{formatTime(time)}</strong>
  )
}

export default Clock