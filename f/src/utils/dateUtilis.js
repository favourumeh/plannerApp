export function datetimeToString(datetime){
    return !datetime? null : datetime.toISOString().split("T")[0] 
}

export function datetimeLocalToString(datetime){
    const [day, month, year] = datetime.toLocaleDateString().split("/")
    return `${year}-${month}-${day}`
}


export function getDaysBetweenDates(date1, date2) {// get the days between two dates
    const d1 = new Date(date1.toISOString().split('T')[0])
    const d2 = new Date(date2.toISOString().split('T')[0])
    const diffTime = Math.abs(d2 - d1)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

export function getDayFromDate(date){
    return !date? null : new Date(date).toLocaleDateString("en-US", { weekday: 'short' })
}

export function isDateOlder(date1, date2) { //checks if date1 is older than date12
    const d1 = new Date(date1)
    const d2 = new Date(date2)

    d1.setHours(0, 0, 0, 0)
    d2.setHours(0, 0, 0, 0)

    return d1 < d2
}

export function formatTotalMins(totalTimeInMins){ // takes time in mins and converts it to hrs and mins > 60mins
        if (totalTimeInMins < 60) return `${totalTimeInMins}mins`

        const totalTaskHours = totalTimeInMins/60
        const minRemainder = Math.abs(Math.round(60*(Math.floor(totalTaskHours) - totalTaskHours)))
        return `${Math.floor(totalTimeInMins/60)}hrs ${minRemainder}mins`
    }
    
export function formatTaskMins (totalTimeInMins) { 
    if (totalTimeInMins < 60) return `${totalTimeInMins}mins` //{time: totalTimeInMins, units: "mins"}
    const totalTaskHours = totalTimeInMins/60
    return `${Number(totalTaskHours.toFixed(0))}hrs` //{time: Math.floor(totalTimeInMins/60), units: "hrs"}
}