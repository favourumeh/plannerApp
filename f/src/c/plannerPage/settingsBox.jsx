import DatePicker from "react-datepicker"
import "./settingsBox.css"


const datetimeToString = (datetime) => {
    return !datetime? null : datetime.toISOString().split("T")[0] 
}

export function SettingsBox ({periodStart, setPeriodStart, periodEnd, setPeriodEnd, isExpandAllDateCards, setIsExpandAllDateCards, isJustUnscheduledTask, setIsJustUnscheduledTask, isExpandAllUnscheduledEntities, setIsExpandAllUnscheduledEntities}) {
    return (
        <div className="planner-settings-box"> 
            <div className="planner-setting-header"> Settings </div>

            <div className="planner-settings-period planner-settings-item"> 
                <span> Period:</span>
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

        </div>
    )

}