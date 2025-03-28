import React from 'react';
import Dropdown from './Dropdown';
import globalContext from '../context';
import { useContext } from 'react';
import "./toolbar.css"

const Toolbar = () => {
    const { sitePage, setSitePage, setForm, handleRefresh, setIsModalOpen, tasks, projects, objectives, setEntityName, setEntity} = useContext(globalContext);

    const handleCreateContent = (content) => {
        setForm(`create-${content}`)
        setIsModalOpen(true)
    }
    const onClickViewProjects = () => {
        setSitePage("view-projects")
        setEntityName("project")
        setEntity(projects)
    }
    const onClickViewObjectives = () => {
        setSitePage("view-objectives")
        setEntityName("objective")
        setEntity(objectives)
    }

    const onClickViewTasks = () => {
        setSitePage("view-tasks")
        setEntityName("task")
        setEntity(tasks)
    }

    return (
        <div className="toolbar">
            <Dropdown buttonContent={<i className="fa fa-plus" aria-hidden="true"></i>}>
                <div onClick={() => handleCreateContent("task")}> Create Task</div>
                <div onClick={() => handleCreateContent("objective")}> Create Objective</div>
                <div onClick={() => handleCreateContent("project")}> Create Project</div>
            </Dropdown>
            <Dropdown buttonContent={<i className="fa fa-eye" aria-hidden="true"></i>}>
                {sitePage=="view-projects"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewProjects}> view projects </div>}
                {sitePage=="view-objectives"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>:<div onClick={onClickViewObjectives}> view objectives </div>}
                {sitePage=="view-tasks"? <div onClick={() => setSitePage("view-homepage")}>Homepage</div>: <div onClick={onClickViewTasks}> view tasks </div>}
            </Dropdown>
            <button type="button" className="refresh-btn" onClick={() => handleRefresh(false)} > <i className="fa fa-refresh" aria-hidden="true"></i> </button>
            <Dropdown buttonContent={<i className="fa fa-filter" aria-hidden="true"></i>}>
                <div> by project </div>
                <div> by objective</div>
                <div> by task </div>
            </Dropdown>
        </div>
    );
};

export default Toolbar;