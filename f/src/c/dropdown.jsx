import "./dropdown.css"

const Dropdown = ({buttonContent, children}) => {
    return (
        <div className="dropdown">
            <button className="dropbtn">{buttonContent}</button>
            <div className="dropbtn-content">
                {children}
            </div>
        </div>
    )
}
export default Dropdown
