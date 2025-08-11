import "./bulkMode.css"
import { useContext, useState } from 'react'
import localPlannerPageContext from './localPlannerPageContext'
import { useMutation } from "@tanstack/react-query"
import { bulkShiftTaskMutation } from "../../fetch_entities"
import globalContext from "../../context"

function BulkMode({refetchPlannerTasks}) {
    const { setBulkMode, tasks, idsOfTasksToUpdate,  setIdsOfTasksToUpdate, updatedTasks, setUpdatedTasks, isPreviewBulkShift, setIsPreviewBulkShift } = useContext(localPlannerPageContext)
    const { handleNotification, handleLogout } = useContext(globalContext)
    const [ taskScheduleShiftAmount, setTaskScheduleShiftAmount ] = useState(0) // schedule shift amount in days
    const [ updateBtnTextColour, setUpdateBtnTextColour] = useState("grey")
    const bulkShiftMutation = useMutation({
        mutationFn: bulkShiftTaskMutation,
        onSuccess:() => {
            setTaskScheduleShiftAmount(0)
            setIsPreviewBulkShift(false)
            refetchPlannerTasks()
            setUpdatedTasks([])
            setIdsOfTasksToUpdate([])
        },
    })

    const exitBulkMode = (e) => {
        e.stopPropagation()
        setBulkMode(false)
        setTaskScheduleShiftAmount(0)
        setIsPreviewBulkShift(false)
        setUpdatedTasks([])
        setIdsOfTasksToUpdate([])
    }

    const handleShiftTask = (shiftAmount_) => {
        setTaskScheduleShiftAmount(Math.round(shiftAmount_))
        const tasksToUpdate_ = tasks?.filter(task => idsOfTasksToUpdate.includes(task.id))
        const updatedTasks_ = tasksToUpdate_.map(task => {
            const date_ = new Date(task.scheduledStart).getTime() + shiftAmount_*(24*60*60*1000)
            return { ...task, 
                    scheduledStart: new Date(date_).toISOString().split('T')[0],
                    preview: true }
        })
        setUpdatedTasks(updatedTasks_)
    }
    const onChangeShiftAmount =  (e)  => {
        const shiftAmount_ = e.target.value
        handleShiftTask(shiftAmount_)
    }
    const onClickShiftArrows = (e, direction) => {
        e.stopPropagation()
        const shiftAmount_ = direction==="forward"?  taskScheduleShiftAmount + 1 : taskScheduleShiftAmount -1 
        handleShiftTask(shiftAmount_)
    }
    const handleCickPreview = (e)  => {
        e.stopPropagation()
        setIsPreviewBulkShift(!isPreviewBulkShift)
    }

    const handleBulkUpdateTask = (e) => {
        e.stopPropagation()
        bulkShiftMutation.mutate({
            updatedTasks: updatedTasks,
            handleNotification: handleNotification, 
            handleLogout: handleLogout,
        })

    }
    
    const checkDisableUpdateBtn = () => {
        let disable = false 
        if (updatedTasks.length === 0){disable=true}
        if (taskScheduleShiftAmount === 0 ) {disable=true}
        return disable
    }

    return (
        <div  className="planner-settings-box">
            <div className="planner-setting-header bulk-settings-header"> 
                <i className="fa fa-arrow-left period-navigator" aria-hidden="true" onClick={exitBulkMode}/> 
                &nbsp; Bulk Shift Settings (beta)    
            </div>
            <div className="selected-task-count planner-settings-item bulk-settings"> Number of task selected: {idsOfTasksToUpdate.length}</div>

            <div className="add-days-to-task-scheduled planner-settings-item bulk-settings">
                <span> Add "n" days to the scheduled date: </span>&nbsp; &nbsp;
                <i className="fa fa-arrow-left period-navigator" aria-hidden="true" onClick={(e) => onClickShiftArrows(e, "backward")}/>
                &nbsp; &nbsp; 
                <input 
                    type = "number"
                    id = "username"
                    className="bulk-shift-amount"
                    name = "username"
                    value = {taskScheduleShiftAmount}
                    step= "1"
                    onChange = {onChangeShiftAmount}
                    required
                    />
                &nbsp; &nbsp; 
                <i className="fa fa-arrow-right period-navigator" aria-hidden="true" onClick={(e) => onClickShiftArrows(e, "forward")}/>
            </div>

            <div className="bulk-settings preview-and-update-btn">
                <button style={{color: isPreviewBulkShift? "rgb(0,230,0)": "white"}} onClick={handleCickPreview}> Preview</button>
                <button
                    style = {{color:updateBtnTextColour, cursor: updateBtnTextColour==="grey"? "default": "pointer"}}
                    onClick={handleBulkUpdateTask}
                    disabled={checkDisableUpdateBtn()}
                    onMouseEnter={() => checkDisableUpdateBtn()? setUpdateBtnTextColour("grey"): setUpdateBtnTextColour("rgba(0, 230,0)") }
                    onMouseLeave={() => checkDisableUpdateBtn()? setUpdateBtnTextColour("grey"): setUpdateBtnTextColour("white")}
                    > Update</button>
            </div>

        </div>
  )
}

export default BulkMode