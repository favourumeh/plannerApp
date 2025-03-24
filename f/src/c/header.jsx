import "./header.css"
import Clock from "./clock.jsx"
import globalContext from "../context.js";
import {useContext} from "react"

const Header = () => {
    const {handleLogout} = useContext(globalContext)
    return (
        <header>
            <div className="header-overlay">
                <button type="button" className="settings-btn" > <i className="fa fa-bars" aria-hidden="true"></i> </button>
                Task Manager <Clock/>
                <button type="button" className="logout-btn" onClick={handleLogout}> Logout </button>
            </div>
        </header>
    );
};

export default Header;