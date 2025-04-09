import "./timeslotCards.css";
import { useState, useEffect, useContext } from "react";
import globalContext from "../context";

function TimeslotCards({dayStart, dayEnd, timeIntervalInMinutes}) {

    const generateTimeSlots = (dayStart, dayEnd, timeIntervalInMinutes) => {
        const dayStartDT = new Date().setHours(dayStart.split(":")[0], dayStart.split(":")[1], 0, 0) 
        const dayEndDT = new Date().setHours(dayEnd.split(":")[0], dayEnd.split(":")[1], 0, 0) 
        const numberOfSlots = Math.floor((dayEndDT - dayStartDT) / (timeIntervalInMinutes * 60 * 1000)) 
        const timeSlots = []
        var finalSlotInterval = timeIntervalInMinutes
        for (let i = 0; i <= numberOfSlots; i++) {
            const time = new Date(dayStartDT + i * timeIntervalInMinutes * 60 * 1000) 
            const formattedTime = time.toLocaleDateString('en-uk', { hour: '2-digit', minute: '2-digit', hour12: false })
            timeSlots.push(formattedTime.slice(-5))
        }
        const finalSlot = new Date(dayEndDT).toLocaleDateString("en-uk", { hour: "2-digit", minute: "2-digit", hour12:false}).slice(-5)
        if (timeSlots[timeSlots.length-1] != finalSlot){
            console.log(timeSlots)
            timeSlots.push(finalSlot)
            const finalSlotIntervalMs = new Date(dayEndDT)- new Date(dayStartDT + (numberOfSlots) * timeIntervalInMinutes * 60 * 1000)
            finalSlotInterval =  Math.floor(finalSlotIntervalMs / (1000 * 60)); //conver ms to mins

        }
        const timeSlotText = []
        for (let i=0; i< timeSlots.length-1; i+=1 ) {
            timeSlotText.push(`${timeSlots[i]}-${timeSlots[i+1]}`)

        }
        return {"timeSlots": timeSlotText, "finaltimeSlotInterval": finalSlotInterval}
    }

    const [timeSlots, setTimeSlots] = useState(generateTimeSlots(dayStart, dayEnd, timeIntervalInMinutes))

    return (
        <div className="timeslots-overlay">
            { timeSlots.timeSlots.map((timeSlot, index) => 
                <div 
                    style={{
                        "borderBottom": index==timeSlots.timeSlots.length-1? "none":"1px solid", 
                        "borderBottomLeftRadius": index==timeSlots.timeSlots.lengtht-1? "8px":"0px",
                        "height": index == timeSlots.timeSlots.length-1? 1.5*timeSlots.finaltimeSlotInterval : 1.5*timeIntervalInMinutes,
                        "boxSizing":"border-box" }}
                    id = {`timeslot-${index}`} 
                    className="timeslot"> 
                    <div id = {`timeslot-${index}-text`}> {timeSlot} </div>
                </div>
            )}
        </div>
    )
}

export default TimeslotCards