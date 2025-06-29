import "./notificationBar.css"
import globalContext from "../context"
import { useState, useRef, useEffect, useContext } from "react"

function NotificationBar () {
    const {notificationMessage, setNotificationMessage, isNotiBarVisible, setIsNotiBarVisible, isNotiMessageError, notificationId} = useContext(globalContext)
    const [isNotiBarExpanded, setIsNotiBarExpanded] = useState(false)
    const [isHoverNotificationBar, setIsHoverNotificationBar] = useState(false)
    const notiBarTimerRef = useRef()

    useEffect(() => {
        if (!isHoverNotificationBar){
            notiBarTimerRef.current = setTimeout(()=> {
                setIsNotiBarVisible(false)
            }, 5000)
        }
        return () => clearTimeout(notiBarTimerRef.current)
    },
    [isHoverNotificationBar, notificationId] // 1-
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
    // //monitoring use-Effect: Can comment out
    // useEffect(() => {console.log("isNotiBarVisible:", isNotiBarVisible)}, [isNotiBarVisible] ) // used to track noti bar is removed from html
    // useEffect(() => {console.log("isHoverNotificationBar:",  isHoverNotificationBar)}, [isHoverNotificationBar]) //used to track if mouse hovers over noti bar#
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

/*
    1- notificationId is a unique identifier for each notification instance. This Forces the 5 second timeout of the notificatgion reset with every new notification instance. 
        Previously the notifcation message was used instead of id which forced the 
*/ 

