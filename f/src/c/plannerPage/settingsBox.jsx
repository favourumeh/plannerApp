import DatePicker from "react-datepicker"
import "./settingsBox.css"
import { useContext, useState } from "react"
import localPlannerPageContext from "./localPlannerPageContext"
import { datetimeLocalToString, getDaysBetweenDates } from "../../utils/dateUtilis"

const isMonthBoundary = (date) => {
    const d = new Date(date)
    const firstDay = d.getDate() === 1
    const lastDay = d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() 
    return { isFirstDay: firstDay, isLastDay: lastDay }
}

export function SettingsBox ({periodStart, setPeriodStart, periodEnd, setPeriodEnd, isExpandAllDateCards, setIsExpandAllDateCards, isJustUnscheduledTask, setIsJustUnscheduledTask, isExpandAllUnscheduledEntities, setIsExpandAllUnscheduledEntities}) {
    const {maxDailyWorkingHours, setMaxDailyWorkingHours, isExcludeBreakHours, setIsExcludeBreakHours } = useContext(localPlannerPageContext)
    const [isSettingBoxExpanded, setIsSettingsBoxExpanded] = useState(false)

    const calculatePeriodDates = async ( {ps, pe, periodDuration, boundaryType, navDirection} ) => {
        if ( isMonthBoundary( periodStart ).isFirstDay && isMonthBoundary( periodEnd ).isLastDay ) {
            if ( navDirection === "previous-period") {
                return ( boundaryType === "start"? 
                    datetimeLocalToString( new Date(ps.getFullYear(), ps.getMonth()-1, 1) ) 
                    : datetimeLocalToString( new Date(pe.getFullYear(), pe.getMonth(), 0) ) 
                )
            }else if (navDirection === "next-period"){
                return ( boundaryType === "start"? 
                    datetimeLocalToString( new Date(ps.getFullYear(), ps.getMonth()+1, 1) ) 
                    : datetimeLocalToString( new Date(pe.getFullYear(), pe.getMonth()+2, 0) ) 
                )
            }
        }

        if ( navDirection === "previous-period") {
            return ( boundaryType === "start"? 
                datetimeLocalToString( new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() - periodDuration )) ) 
                : datetimeLocalToString( new Date(new Date(periodEnd).setDate(new Date(periodEnd).getDate() - periodDuration )) ) 
            )
        }else if (navDirection === "next-period"){
            return ( boundaryType === "start"? 
                datetimeLocalToString( new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() + periodDuration)) ) 
                : datetimeLocalToString( new Date(new Date(periodEnd).setDate(new Date(periodEnd).getDate() + periodDuration)) ) 
            )
        }
    }

    const handlePeriodNavigation = async (navDirection) => {// Flick through periods on the planner page by clicking the left and right arrows
        const ps = new Date(periodStart)
        const pe = new Date(periodEnd)
        const periodDuration = getDaysBetweenDates(ps, pe) +1
        const newPeriodStart = await calculatePeriodDates( {ps, pe, periodDuration, boundaryType:"start", navDirection} )
        const newPeriodEnd = await calculatePeriodDates( {ps, pe, periodDuration, boundaryType:"end", navDirection} )
        switch (navDirection) {
            case "previous-period":
                await setPeriodStart( newPeriodStart )
                await setPeriodEnd( newPeriodEnd )
                break
            case "next-period":
                await setPeriodEnd( newPeriodEnd )
                await setPeriodStart( newPeriodStart  )
                break
        }
    }

    const periodToCurrentMonth = async (e) => {
        e.stopPropagation()
        const today = new Date()
        const firstDayOfCurrentMonth = new Date(today.setDate(1))
        const newPeriodStart = datetimeLocalToString(firstDayOfCurrentMonth)
        const dateOvershoot = new Date(today.setDate(32)) // "32" goes to next month
        const finalDayOfCurrentMonth = new Date(dateOvershoot.setDate(0)) // "0" goes to the end of the previous month
        const newPeriodFinish = datetimeLocalToString(finalDayOfCurrentMonth)

        if (new Date(periodStart) <= firstDayOfCurrentMonth){ // prevents errors: periodEnd < periodStart
            await setPeriodEnd(newPeriodFinish)
            await setPeriodStart(newPeriodStart)
        } else {
            await setPeriodStart(newPeriodStart)
            await setPeriodEnd(newPeriodFinish)
        }
    }

    return (
        <div className="planner-settings-box"> 
            <div className="planner-setting-header" onDoubleClick={() => setIsSettingsBoxExpanded(!isSettingBoxExpanded)}> Settings </div>
            {isSettingBoxExpanded? 
                <>
                <div className="planner-settings-period planner-settings-item"> 
                    <span> Period:&nbsp; &nbsp;</span>
                    <i className="fa fa-arrow-left period-navigator" aria-hidden="true" onClick={() => handlePeriodNavigation("previous-period")}></i>
                    &nbsp; &nbsp; 

                    <DatePicker
                        selected={new Date(periodStart)}
                        onSelect={(date) => setPeriodStart(datetimeLocalToString(date))} 
                        onChange={(date) => setPeriodStart(datetimeLocalToString(date)) }
                        dateFormat="yyyy-MM-dd"
                    />
                    <div>
                        <i className="fa fa-arrows-h" aria-hidden="true" onClick={periodToCurrentMonth}></i>
                    </div>
                    <DatePicker
                        selected={new Date(periodEnd)}
                        onSelect={(date) => setPeriodEnd(datetimeLocalToString(date))} 
                        onChange={(date) => setPeriodEnd(datetimeLocalToString(date))}
                        dateFormat="yyyy-MM-dd"
                    />
                    &nbsp; &nbsp;
                    <i className="fa fa-arrow-right period-navigator" aria-hidden="true" onClick={() => handlePeriodNavigation("next-period")} ></i>

                </div>
                <div className="date-card-expander planner-settings-item">
                    <span> Expand All Date Cards: </span>&nbsp; &nbsp;
                    {isExpandAllDateCards?
                        <i className="fa fa-check-square-o" aria-hidden="true" onClick={() => setIsExpandAllDateCards(false)}></i>
                        : <i className="fa fa-square-o" aria-hidden="true" onClick={() => setIsExpandAllDateCards(true)}></i>
                    }
                </div>
                <div className="unscheduled-entities-expander planner-settings-item">
                    <span> Expand All Unscheduled Entities: </span>&nbsp; &nbsp;
                    {isExpandAllUnscheduledEntities?
                        <i className="fa fa-check-square-o" aria-hidden="true" onClick={() => setIsExpandAllUnscheduledEntities(false)}></i>
                        : <i className="fa fa-square-o" aria-hidden="true" onClick={() => setIsExpandAllUnscheduledEntities(true)}></i>
                    }
                </div>

                <div className="toggle-just-tasks planner-settings-item"> 
                    <span>Show Just Tasks: </span>
                    {isJustUnscheduledTask? 
                        <i className="fa fa-check-square-o" aria-hidden="true" onClick={() => setIsJustUnscheduledTask(false)}></i>
                        : <i className="fa fa-square-o" aria-hidden="true" onClick={() => setIsJustUnscheduledTask(true)}></i>
                    }
                </div>

                <div className="max-daily-working-hours planner-settings-item"> 
                    <span>Max Daily Working Hours: </span>
                    <input 
                        type = "number"
                        id = "username"
                        className="login-input"
                        name = "username"
                        value = {maxDailyWorkingHours}
                        min="1"
                        max="24"
                        step= "1"
                        onChange = {e => setMaxDailyWorkingHours(Math.round(e.target.value))}
                        required/>
                </div>

                <div className="toggle-excl-break-hrs planner-settings-item"> 
                    <span>Exclude Break Hours: </span>
                    {isExcludeBreakHours? 
                        <i className="fa fa-check-square-o" aria-hidden="true" onClick={() => setIsExcludeBreakHours(false)}></i>
                        : <i className="fa fa-square-o" aria-hidden="true" onClick={() => setIsExcludeBreakHours(true)}></i>
                    }
                </div>

            </>
            : undefined }
        </div>
    )

}