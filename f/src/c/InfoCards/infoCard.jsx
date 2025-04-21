import './infoCard.css'

const InfoCard = ({translate, children}) => {
    //translate example: "50% -30%"
    return (
        <div style={{translate:translate}} className="hover-info-card-overlay">
            {children}
        </div>
    )
}

export default InfoCard