import "./notificationBar.css"
import globalContext from "../context"
import { useState, useRef, useEffect, useContext } from "react"

function NotificationBar () {
    const {notificationMessage, setNotificationMessage, isNotiBarVisible, setIsNotiBarVisible, isNotiMessageError, requestAmount, notiBarTimerRef} = useContext(globalContext)
    const [isNotiBarExpanded, setIsNotiBarExpanded] = useState(false)
    const [isHoverNotificationBar, setIsHoverNotificationBar] = useState(false)

    useEffect(() => {
        if (!isHoverNotificationBar){
            notiBarTimerRef.current = setTimeout(()=> {
                setIsNotiBarVisible(false)
            }, 5000)
        }
        return () => clearTimeout(notiBarTimerRef.current)
    },
    [isHoverNotificationBar, notificationMessage]
    )

    const handleMouseEnter = () => {
        setIsHoverNotificationBar(true)
        clearTimeout(notiBarTimerRef.current)
    }
    const handleMouseLeave = () => setIsHoverNotificationBar(false)
    const extendNotiBar = ()  => setIsNotiBarExpanded(!isNotiBarExpanded)

    const handleCloseNotiBar = () => {
        setIsNotiBarVisible(false)
        setNotificationMessage("")
        setIsHoverNotificationBar(false)
    }
    //monitoring use-Effect: Can comment out
    useEffect(() => {console.log("isNotiBarVisible:", isNotiBarVisible)}, [isNotiBarVisible] ) // used to track noti bar is removed from html
    useEffect(() => {console.log("isHoverNotificationBar:",  isHoverNotificationBar)}, [isHoverNotificationBar]) //used to track if mouse hovers over noti bar#
    // useEffect(() => console.log("timerRef:",notiBarTimerRef), [notiBarTimerRef.current])


    if (!isNotiBarVisible) {
        return null
    }
    return (
        <div 
            id="notification-overlay"
            className={isNotiBarVisible? 'animation' : ''}
            style={{"backgroundColor":isNotiMessageError? "#fd000086":"#1abc9c86"}}
            onClick={extendNotiBar}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}>
            <div className="notification-message" style={{"WebkitLineClamp":isNotiBarExpanded? 5:1}}> {notificationMessage} </div>
            <button className="close-noti-btn" type="button"onClick={handleCloseNotiBar}> &times; </button>
        </div>
    )
}

export default NotificationBar

