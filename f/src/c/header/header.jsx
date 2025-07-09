import "./header.css"
import Clock from "./clock.jsx"
import globalContext from "../../context.js";
import { backendEnv } from '../../../project_config.js'
import {useContext} from "react"

const Header = () => {
    const {setSitePage, handleLogout} = useContext(globalContext)
    const onClickTitle = () => {
        setSitePage("view-homepage")
    }

    return (
        <header>
            <div className="header-overlay">
                <button type="button" className="settings-btn" > <i className="fa fa-bars" aria-hidden="true"></i> </button>
                <span className="header-title" onClick={onClickTitle}>
                    Task Manager<span style={{color: "red"}}>{`${backendEnv==="dev"? "(dev)" : ""}`} </span>
                </span> <Clock/>
                <button type="button" className="logout-btn" onClick={handleLogout}> Logout </button>
            </div>
        </header>
    );
};

export default Header;