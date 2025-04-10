#This handles all the task routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from models import User, Project, Objective, Task
from plannerPackage import login_required, token_required, generate_all_user_content, generate_user_content, generate_entity_number, convert_date_str_to_datetime 
from config import db, app, serializer
from typing import Tuple, List
from datetime import datetime, timezone, timedelta

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
    user_id = session["userId"]
    content = request.json
    task_number = content.get("taskNumber", None)
    status = content.get("status", "To-Do")
    description = content.get("description", None)
    duration = content.get("duration", None)
    priority_score = content.get("priorityScore", 1)
    scheduled_start = content.get("scheduledStart", None)
    scheduled_finish = content.get("scheduledFinish", None)
    start = content.get("start", None)
    finish = content.get("finish", None)
    previous_task_id = content.get("previousTaskId", None)
    next_task_id = content.get("nextTaskId", None)
    is_recurring = content.get("isRecurring", False)
    dependencies = content.get("dependencies", None)
    last_updated = datetime.now(tz=timezone.utc)
    was_paused = content.get("wasPaused", False)
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
    
    if not duration:
        resp_dict["message"] = "Failure: Task is missing a duration (mins)."
        return jsonify(resp_dict), 400

    scheduled_start = convert_date_str_to_datetime(scheduled_start, '%Y-%m-%dT%H:%M')
    scheduled_finish = convert_date_str_to_datetime(scheduled_finish, '%Y-%m-%dT%H:%M')
    start = convert_date_str_to_datetime(start, '%Y-%m-%dT%H:%M')
    finish = convert_date_str_to_datetime(finish, '%Y-%m-%dT%H:%M')

    if not was_paused:
        task_number = generate_entity_number(entity_number=task_number, parent_entity_id=objective_id, parent_entity_name="objective", entity_name="task", entity=Task)
    else:
        task_number = content.get("taskNumber")

    try:
        task = Task(task_number=task_number, status=status, description=description, 
                    duration=duration, priority_score=priority_score, 
                    scheduled_start=scheduled_start, scheduled_finish=scheduled_finish, start=start, finish=finish,
                    previous_task_id=previous_task_id, next_task_id=next_task_id, is_recurring=is_recurring, 
                    dependencies=dependencies, last_updated=last_updated, was_paused=was_paused, tag=tag, objective_id=objective_id)
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
    user_id = session["userId"]
    try:
        tasks: List[Task] = generate_user_content(user_id=user_id, content="tasks")
        resp_dict["message"] = "Success: user's tasks loaded"
        resp_dict["tasks"] = [task.to_dict() for task in tasks]
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user task! Reason: {e}"
        return jsonify(resp_dict), 404

#read - all projects, objectives and tasks
@app.route("/read-all", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_all():
    """Reads all user's projects, objectives and tasks."""
    resp_json = {"message":"", "tasks":"", "objectives":"", "projects":""}
    user_id = session["userId"]
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
    user_id = session["userId"]
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
    task.duration = content.get("duration", task.duration)
    task.priority_score = content.get("priorityScore", task.priority_score)
    task.start = content.get("start", task.start)
    task.finish = content.get("finish", task.finish)
    task.scheduled_start = content.get("scheduledStart", task.scheduled_start)
    task.scheduled_finish = content.get("scheduledFinish", task.scheduled_finish)
    task.previous_task_id = content.get("previousTaskId", task.previous_task_id)
    task.next_task_id = content.get("nextTaskId", task.next_task_id)
    task.is_recurring = content.get("isRecurring", task.is_recurring)
    task.dependencies = content.get("dependencies", task.dependencies)
    task.last_updated = datetime.now(tz=timezone.utc)
    task.was_paused = content.get("wasPaused", task.was_paused)
    task.tag = content.get("tag", task.tag)
    objective_id = content.get("objectiveId", task.objective_id)

    task.scheduled_start = convert_date_str_to_datetime(task.scheduled_start, '%Y-%m-%dT%H:%M')
    task.scheduled_finish = convert_date_str_to_datetime(task.scheduled_finish, '%Y-%m-%dT%H:%M')
    task.start = convert_date_str_to_datetime(task.start, '%Y-%m-%dT%H:%M')
    task.finish = convert_date_str_to_datetime(task.finish, '%Y-%m-%dT%H:%M')

    #Check if task being updated already exist in the objective
    existing_task = Task.query.filter_by(id = task_id, objective_id=objective_id).first()
    if not existing_task: # if no existing task is found in the objective, it means the task is being moved from another objective
        task.task_number = generate_entity_number(entity_number=None, parent_entity_id=objective_id, parent_entity_name="objective", entity_name="task", entity=Task)
        task.objective_id = objective_id 
    
    if len(task.description) > int(task_description_limit):
        resp_dict["message"] = f"Failure: The task description is over the {task_description_limit} char limit."
        return jsonify(resp_dict), 400
        
    try:
        db.session.commit()
        resp_dict["message"] = "Success: Task has been updated!"
        resp_dict["task"] = task.to_dict()
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = "Failure: Task could not be updated!"
        return jsonify(resp_dict), 404

#delete
@task.route("/delete-task/<int:task_id>", methods=["DELETE"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_task(task_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""}
    user_id = session["userId"]
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
        db.session.delete(task)
        db.session.commit()
        resp_dict["message"] = "Success: The task was deleted!"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = "Failure: The task could not be delete"
        return jsonify(resp_dict), 404



