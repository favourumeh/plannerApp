import "./dropdown.css"

const Dropdown = ({buttonContent, buttonClassName, translate, children}) => {
    return (
        <div className="dropdown">
            <button className={`dropbtn ${buttonClassName}`}>{buttonContent}</button>
            <div style={{"translate": translate}} className="dropbtn-content">
                {children}
            </div>
        </div>
    )
}
export default Dropdown
