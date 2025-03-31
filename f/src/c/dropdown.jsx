import "./dropdown.css"

const Dropdown = ({buttonContent, translate, children}) => {
    return (
        <div className="dropdown">
            <button className="dropbtn">{buttonContent}</button>
            <div style={{"translate": translate}} className="dropbtn-content">
                {children}
            </div>
        </div>
    )
}
export default Dropdown
