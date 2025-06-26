export function datetimeToString(datetime){
    return !datetime? null : datetime.toISOString().split("T")[0] 
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
