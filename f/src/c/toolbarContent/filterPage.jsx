import Dropdown from "../Dropdown"

function FilterPage() {
    return (
        <Dropdown buttonContent={<i className="fa fa-filter" aria-hidden="true"></i>} translate={"0% 52%"}>
            <div> by project </div>
            <div> by objective</div>
            <div> by task </div>
        </Dropdown>
    )
}

export default FilterPage