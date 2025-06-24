#This handles all the task routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from flask_sqlalchemy.pagination import Pagination
from flask_sqlalchemy.query import Query
from models import User, Project, Objective, Task
from plannerPackage import login_required, token_required, generate_all_user_content, generate_user_content, generate_entity_number, convert_date_str_to_datetime 
from config import db, app, serializer
from typing import Tuple, List
from datetime import datetime, timedelta
from pytz import timezone

#create blueprint
task = Blueprint("task", __name__)

#import env vars from b/.env
load_dotenv()

task_description_limit = int(os.environ["task_description_limit"])

#tasks routes 
#create
@task.route("/create-task", methods=["POST"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_task() -> Tuple[Response, int]:
    resp_dict = {"message":"", "task":""}
    user_id: int = session["userId"]
    content = request.json
    task_number = content.get("taskNumber", None)
    status = content.get("status", "To-Do")
    description = content.get("description", None)
    duration_est = content.get("durationEst", None)
    duration = content.get("duration", None)
    priority_score = content.get("priorityScore", 1)
    scheduled_start = content.get("scheduledStart", None)
    start = content.get("start", None)
    finish = content.get("finish", None)
    is_recurring = content.get("isRecurring", False)
    last_updated = datetime.now(tz=timezone('Europe/London'))
    was_paused = content.get("wasPaused", False)
    parent_task_id = content.get("parentTaskId", None)
    tag = content.get("tag", None)
    objective_id = content.get("objectiveId", None)

    if not objective_id:
        resp_dict["message"] = "Failure: Objective ID missing. The Task is not assigned any project."
        return jsonify(resp_dict), 400

    objective = Objective.query.filter_by(id=objective_id).first()

    if not objective:
        resp_dict["message"] = "Failure: The Objective ID provided does not exist."
        return jsonify(resp_dict), 404

    project = Project.query.filter_by(id=objective.project_id, user_id=user_id).first()
    
    if not project:
        resp_dict["message"] = "Failure: The specified objective does not belong to the user."
        return jsonify(resp_dict), 403

    if not description:
        resp_dict["message"] = "Failure: Task is missing a description."
        return jsonify(resp_dict), 400

    if len(description) > int(task_description_limit):
        resp_dict["message"] = f"Failure: The description is over the {task_description_limit} char limit."
        return jsonify(resp_dict), 400
    
    if not duration_est:
        resp_dict["message"] = "Failure: Task is missing a duration_est (mins)."
        return jsonify(resp_dict), 400
    
    if isinstance(duration, int):
        if duration <= 0:
            resp_dict["message"] = "Failure: Task duration cannot be zero or negative."
            return jsonify(resp_dict), 400

    scheduled_start = convert_date_str_to_datetime(scheduled_start, '%Y-%m-%d')
    start = convert_date_str_to_datetime(start, '%Y-%m-%dT%H:%M')
    finish = convert_date_str_to_datetime(finish, '%Y-%m-%dT%H:%M')
    
    if status !="Completed" and finish is not None:
        resp_dict["message"] = "Failure: Task cannot have a finish date and be incomplete."
        return jsonify(resp_dict), 400
    
    if not was_paused:
        task_number = generate_entity_number(entity_number=task_number, parent_entity_id=objective_id, parent_entity_name="objective", entity_name="task", entity=Task)
    else:
        task_number = content.get("taskNumber")

    try:
        task = Task(task_number=task_number, status=status, description=description, 
                    duration_est=duration_est, duration=duration, priority_score=priority_score, 
                    scheduled_start=scheduled_start, start=start, finish=finish,
                    is_recurring=is_recurring, last_updated=last_updated,
                    was_paused=was_paused, parent_task_id=parent_task_id, tag=tag, objective_id=objective_id)
        db.session.add(task)
        db.session.commit()
        resp_dict["message"] = "Success: Added Task to db!"
        resp_dict["task"] = task.to_dict()
        return jsonify(resp_dict), 201
    except Exception as e:
        resp_dict["message"] = f"Failure: The Task could not be added to the db! Reason: {e}"
        return jsonify(resp_dict), 404

#read
@task.route("/read-tasks", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_tasks(): 
    resp_dict = {"message":"", "tasks":""}
    user_id: int = session["userId"]
    try:
        tasks: List[Task] = generate_user_content(user_id=user_id, content="tasks")
        resp_dict["message"] = "Success: user's tasks loaded"
        resp_dict["tasks"] = [task.to_dict() for task in tasks]
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user task! Reason: {e}"
        return jsonify(resp_dict), 404

# Query read-tasks   
@task.route("/query-tasks", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def query_tasks(): 
    """Queries the user's tasks."""
    resp_dict = {"message":"", "tasks":""}
    user_id: int = session["userId"]
    query: Query = Task.query.join(Objective).join(Project).filter(Project.user_id == user_id) #users_tasks

    #query params
    pagination = None
    page: int = request.args.get("page", default=None, type=int)
    per_page: int = request.args.get("perPage", default=None, type=int)
    objective_id: int = request.args.get("objectiveId", default=None, type=int)
    status: str = request.args.get("status", default=None, type=str) #can be a string list
    selected_date: str = request.args.get("selectedDate", default=None, type=str)
    site_page: str = request.args.get("sitePage", default=None, type=str)
    period_start: str = request.args.get("periodStart", default=None, type=str)
    period_end: str = request.args.get("periodEnd", default=None, type=str)

    if objective_id:
        query: Query = query.filter(Task.objective_id == objective_id)
        resp_dict["_objectiveId"] = objective_id
    if status:
        statusList: List[str] = status.split(",")
        query: Query = query.filter(Task.status.in_(statusList))
        resp_dict["_status"] = status
    if site_page == "homepage":
        selected_date: datetime = convert_date_str_to_datetime(selected_date, "%Y-%m-%d")
        query: Query = query.filter(db.func.date(Task.start) == selected_date.date())
        resp_dict["_selectedDate"] =  selected_date.strftime("%Y-%m-%d")
    if site_page == "kanban":
        selected_date: datetime = convert_date_str_to_datetime(selected_date, "%Y-%m-%d")
        query: Query = query.filter(
            db.or_(
                db.func.date(Task.finish) == selected_date.date(),
                db.func.date(Task.scheduled_start) == selected_date.date(), 
                Task.status != "Completed"
            )
        )
        resp_dict["_selectedDate"] = selected_date.strftime("%Y-%m-%d")
    if (site_page=="planner"):
        period_start: datetime = convert_date_str_to_datetime(period_start, "%Y-%m-%d")
        period_end: datetime = convert_date_str_to_datetime(period_end, "%Y-%m-%d")

        if (period_end<period_start):
            resp_dict["message"] = "Failure: End date cannot be before start date. Please change this."
            resp_dict["tasks"], resp_dict["taskObjectives"], resp_dict["taskProjects"] = [], [], []
            return jsonify(resp_dict), 400

        query: Query = query.filter( # query unsheduled/scheduled/started tasks within period
            db.or_(
                db.and_(
                    db.func.date(Task.scheduled_start) >= period_start,
                    db.func.date(Task.scheduled_start) <= period_end,
                ),
                db.and_(
                    db.func.date(Task.start) >= period_start, #included because task should be shown in the planner page when the task is started if it starts after/before its scheduled date
                    db.func.date(Task.start) <= period_end,
                ),
                Task.scheduled_start == None, # unscheduled tasks
            )
        )
        resp_dict["periodStart"] = period_start.strftime("%Y-%m-%d")
        resp_dict["periodEnd"] = period_end.strftime("%Y-%m-%d")
            
    if page and per_page:
        pagination: Pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        resp_dict["_pages"] = pagination.pages
        resp_dict["_currentPage"] = pagination.page
        resp_dict["_perPage"] = pagination.per_page
        resp_dict["_hasNext"] = pagination.has_next
        resp_dict["_hasPrev"] = pagination.has_prev
    try:
        tasks: List[Task] = pagination.items if pagination else query.all()
        resp_dict["message"] = "Success: user's tasks loaded"
        resp_dict["tasks"] = [task.to_dict() for task in tasks]
        resp_dict["_itemCount"] = len(tasks)

        if (not page) and (resp_dict["_itemCount"]>0): # returns the objectives and projects of the queried tasks when not paginated
            objective_ids: list[int] = [task.objective_id for task in query.all()]
            objectives: list[Objective] = Objective.query.filter(
                db.or_(
                    Objective.id.in_(objective_ids),
                    db.func.date(Objective.date_added) >= (datetime.now(tz=timezone('Europe/London')) - timedelta(days=1)).date(),  # objectives created on or after the previous day. Ensures objectives are visible in the planner page once created. 
                )
            ).all()

            project_ids: List[int] = [objective.project_id for objective in objectives]
            projects: list[Project] = Project.query.filter(
                db.or_(
                    Project.id.in_(project_ids),
                    db.func.date(Project.date_added) >= (datetime.now(tz=timezone('Europe/London')) - timedelta(days=1)).date(),  # projects created on or after the previous day. Ensures ...
                )
            ).all()
            resp_dict["taskObjectives"] = [objective.to_dict() for objective in objectives]
            resp_dict["taskProjects"] = [project.to_dict() for project in projects]

        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user task! Reason: {e}"
        return jsonify(resp_dict), 404

@app.route("/get-tasks-objective-and-project/<int:task_id>", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def get_tasks_objective_and_project(task_id: int):
    """Returns the objective and project of a given task"""
    resp_dict = {"message":"", "objective":"", "project":""}
    user_id: int = session["userId"]
    users_tasks: Query = Task.query.join(Objective).join(Project).filter(Project.user_id == user_id)

    task: Task = Task.query.filter(Task.id == task_id).first()
    if not task:
        resp_dict["message"] = "Failure: The requested task is not in the database. Choose another one."
        return jsonify(resp_dict), 404
    
    task: Task = users_tasks.filter(Task.id == task_id).first()
    if not task:
        resp_dict["message"] = "Failure: The requested task does not belong to the user. Choose another one."
        return jsonify(resp_dict), 403

    objective: Objective = Objective.query.filter(Objective.id == task.objective_id).first()
    project: Project = Project.query.filter( Project.id == objective.project_id ).first()
    resp_dict["message"] = "Success: Task's objective and project was retrieved."
    resp_dict["task"] = task.to_dict()
    resp_dict["objective"] = objective.to_dict()
    resp_dict["project"] = project.to_dict()
    return jsonify(resp_dict), 200

#read - all projects, objectives and tasks
@app.route("/read-all", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_all():
    """Reads all user's projects, objectives and tasks."""
    resp_json = {"message":"", "tasks":"", "objectives":"", "projects":""}
    user_id: int = session["userId"]
    try:
        rts, projects, objectives, tasks = generate_all_user_content(user_id)
        projects = [project.to_dict() for project in projects]
        objectives = [objective.to_dict() for objective in objectives]
        tasks = [task.to_dict() for task in tasks]
        resp_json["projects"] = projects
        resp_json["objectives"] = objectives
        resp_json["tasks"] = tasks
        resp_json["message"] = "Success: Extracted user's projects, objectives and tasks"
        return jsonify(resp_json), 200
    except Exception as e:
        resp_json["message"] = f"Failure: Could not retrieve user's projects, tasks and objectives! Reason: {e}."
        return jsonify(resp_json), 404

#update
@task.route("/update-task/<int:task_id>", methods=["PATCH"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_task(task_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":"", "task":""} 
    user_id: int = session["userId"]
    task = Task.query.filter_by(id=task_id).first()

    if not task:
        resp_dict["message"] = "Failure: The task referenced does not exist."
        return jsonify(resp_dict), 404  

    objective = Objective.query.filter_by(id=task.objective_id).first() 
    project = Project.query.filter_by(id=objective.project_id, user_id=user_id).first()
    if not project:
        resp_dict["message"] = "Failure: The task referenced does not belong to user."
        return jsonify(resp_dict), 403

    content = request.json
    task.status = content.get("status", task.status)
    task.description = content.get("description", task.description)
    task.duration_est = content.get("durationEst", task.duration_est)
    task.duration = content.get("duration", task.duration)
    task.priority_score = content.get("priorityScore", task.priority_score)
    task.start = content.get("start", task.start)
    task.finish = content.get("finish", task.finish)
    task.scheduled_start = content.get("scheduledStart", task.scheduled_start)
    task.is_recurring = content.get("isRecurring", task.is_recurring)
    task.last_updated = datetime.now(tz=timezone('Europe/London'))
    task.was_paused = content.get("wasPaused", task.was_paused)
    task.tag = content.get("tag", task.tag)
    objective_id = content.get("objectiveId", task.objective_id)

    task.scheduled_start = convert_date_str_to_datetime(task.scheduled_start, '%Y-%m-%d')
    task.start = convert_date_str_to_datetime(task.start, '%Y-%m-%dT%H:%M')
    task.finish = convert_date_str_to_datetime(task.finish, '%Y-%m-%dT%H:%M')

    if len(task.description) > int(task_description_limit):
        resp_dict["message"] = f"Failure: The task description is over the {task_description_limit} char limit."
        return jsonify(resp_dict), 400

    if isinstance(task.duration, int):
        if task.duration <= 0:
            resp_dict["message"] = "Failure: Task duration cannot be zero or negative."
            return jsonify(resp_dict), 400
        
    if task.status != "Completed" and task.finish is not None:
        resp_dict["message"] = "Failure: Task cannot have a finish date and be incomplete."
        return jsonify(resp_dict), 400
    
    #Check if task being updated already exist in the objective
    existing_task = Task.query.filter_by(id = task_id, objective_id=objective_id).first()
    if not existing_task: # if no existing task is found in the objective, it means the task is being moved from another objective
        task.task_number = generate_entity_number(entity_number=None, parent_entity_id=objective_id, parent_entity_name="objective", entity_name="task", entity=Task)
        task.objective_id = objective_id 

    try:
        db.session.commit()
        resp_dict["message"] = "Success: Task has been updated!"
        resp_dict["task"] = task.to_dict()
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Task could not be updated! Reason: {e}"
        return jsonify(resp_dict), 404

#delete
@task.route("/delete-task/<int:task_id>", methods=["DELETE"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_task(task_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""}
    user_id: int = session["userId"]
    task = Task.query.filter_by(id=task_id).first()
    if not task:
        resp_dict["message"] = "Failure: The task referenced does not exist."
        return jsonify(resp_dict), 404  

    objective = Objective.query.filter_by(id=task.objective_id).first() #task will definitely belong to an objective as is a condition creating a task
    project = Project.query.filter_by(id=objective.project_id, user_id=user_id).first()
    if not project:
        resp_dict["message"] = "Failure: The task referenced does not beloing to user."
        return jsonify(resp_dict), 403
    
    try:
        # db.session.delete(task)
        if task.parent_task_id: #if task is a child task
            db.session.delete(task)
        else: #if task is a parent task
            #Identify the task and its children for deletion (tasks derived from a 'parent' task)
            db.session.query(Task).filter_by(task_number=task.task_number, objective_id=task.objective_id).delete()
        db.session.commit()
        resp_dict["message"] = "Success: The task was deleted!"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: The task could not be deleted. Reason {e}"
        return jsonify(resp_dict), 404