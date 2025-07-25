import { useContext } from "react";
import "./timeslotCards.css";
import globalContext from "../../context";

function TimeslotCards({dayStartDT, dayEndDT, timeIntervalInMinutes}) {
    const {currentDate} = useContext(globalContext)
    dayStartDT = new Date(dayStartDT).getTime()
    dayEndDT = new Date(dayEndDT).getTime()

    const generateTimeSlots = (dayStartDT, dayEndDT, timeIntervalInMinutes) => {
        const numberOfSlots = Math.floor((dayEndDT - dayStartDT) / (timeIntervalInMinutes * 60 * 1000)) 
        const timeSlots = []
        for (let i = 0; i <= numberOfSlots; i++) {
            const time = new Date(dayStartDT + i * timeIntervalInMinutes * 60 * 1000) 
            const formattedTime = time.toLocaleDateString('en-uk', { hour: '2-digit', minute: '2-digit', hour12: false })
            timeSlots.push(formattedTime.slice(-5))
        }
        const finalTime = new Date(currentDate).setHours(timeSlots[timeSlots.length-1].split(":")[0], timeSlots[timeSlots.length-1].split(":")[1], 0, 0)
        if (finalTime < dayEndDT){
            const finalTimeSlot = finalTime + timeIntervalInMinutes * 60 * 1000
            const finalSlot = new Date(finalTimeSlot).toLocaleDateString("en-uk", { hour: "2-digit", minute: "2-digit", hour12:false}).slice(-5)
            timeSlots.push(finalSlot)
        }
        const timeSlotText = []
        for (let i=0; i< timeSlots.length-1; i+=1 ) {
            timeSlotText.push(`${timeSlots[i]}-${timeSlots[i+1]}`)
        }
        return {"timeSlots": timeSlotText, "finaltimeSlotInterval": "blah"}

    }

    const timeSlots = generateTimeSlots(dayStartDT, dayEndDT, timeIntervalInMinutes)

    return (
        <div className="timeslots-overlay">
            { timeSlots.timeSlots.map((timeSlot, index) => 
                <div 
                    key = {index}
                    style={{
                        "borderBottom": index==timeSlots.timeSlots.length-1? "none":"1px solid", 
                        "borderBottomLeftRadius": index==timeSlots.timeSlots.lengtht-1? "8px":"0px",
                        "height":1.5*timeIntervalInMinutes,
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