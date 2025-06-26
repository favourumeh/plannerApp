import DatePicker from "react-datepicker"
import "./settingsBox.css"
import { useContext } from "react"
import localPlannerPageContext from "./localPlannerPageContext"
import { datetimeToString, getDaysBetweenDates } from "../../utils/dateUtilis"

export function SettingsBox ({periodStart, setPeriodStart, periodEnd, setPeriodEnd, isExpandAllDateCards, setIsExpandAllDateCards, isJustUnscheduledTask, setIsJustUnscheduledTask, isExpandAllUnscheduledEntities, setIsExpandAllUnscheduledEntities}) {
    const {maxDailyWorkingHours, setMaxDailyWorkingHours} = useContext(localPlannerPageContext)
    const periodDuration = getDaysBetweenDates(new Date(periodStart), new Date(periodEnd))

    const handlePeriodNavigation = async (direction) => {// Flick through periods on the planner page by clicking the left and right arrows
        switch (direction) {
            case "previous-period":
                await setPeriodStart( datetimeToString( new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() - periodDuration +1 )) ) )
                await setPeriodEnd( datetimeToString( new Date(new Date(periodEnd).setDate(new Date(periodEnd).getDate() - periodDuration + 1)) ) )
                break
            case "next-period":
                await setPeriodEnd( datetimeToString( new Date(new Date(periodEnd).setDate(new Date(periodEnd).getDate() + periodDuration+1)) ) )
                await setPeriodStart( datetimeToString( new Date(new Date(periodStart).setDate(new Date(periodStart).getDate() + periodDuration+1)) ) ) 
                break
        }
    }
    return (
        <div className="planner-settings-box"> 
            <div className="planner-setting-header"> Settings </div>

            <div className="planner-settings-period planner-settings-item"> 
                <span> Period:&nbsp; &nbsp;</span>
                <i className="fa fa-arrow-left period-navigator" aria-hidden="true" onClick={() => handlePeriodNavigation("previous-period")}></i>
                &nbsp; &nbsp; 

                <DatePicker
                    selected={new Date(periodStart)}
                    onSelect={(date) => setPeriodStart(datetimeToString(date))} 
                    onChange={(date) => setPeriodStart(datetimeToString(date)) }
                    dateFormat="yyyy-MM-dd"
                />
                <div>
                    <i className="fa fa-arrows-h" aria-hidden="true"></i>
                </div>
                <DatePicker
                    selected={new Date(periodEnd)}
                    onSelect={(date) => setPeriodEnd(datetimeToString(date))} 
                    onChange={(date) => setPeriodEnd(datetimeToString(date))}
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

        </div>
    )

}