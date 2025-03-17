#This handles all the task routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from models import User, Project, Objective, Task
from plannerPackage import login_required, token_required, generate_all_user_content, generate_user_content, generate_entity_number
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
    resp_dict = {"message":""}
    user_id = session["userId"]
    content = request.json
    task_number = content.get("taskNumber", None)
    description = content.get("description", None)
    duration = content.get("duration", None)
    priority_score = content.get("priorityScore", 1)
    scheduled_start = content.get("scheduledStart", None)
    scheduled_finish = content.get("scheduledFinish", None)
    is_completed = content.get("isCompleted", False)
    previous_task_id = content.get("previousTaskId", None)
    next_task_id = content.get("nextTaskId", None)
    is_recurring = content.get("isRecurring", False)
    dependencies = content.get("dependencies", None)
    last_updated = datetime.now(tz=timezone.utc)
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

    if isinstance(scheduled_start, str):
        scheduled_start = datetime.strptime(scheduled_start, '%Y-%m-%dT%H:%M:%S.%fZ')

    if isinstance(scheduled_finish, str):
        scheduled_finish = datetime.strptime(scheduled_finish, '%Y-%m-%dT%H:%M:%S.%fZ')  
        
    task_number = generate_entity_number(entity_number=task_number, parent_entity_id=objective_id, parent_entity_name="objective", entity_name="task", entity=Task)

    try:
        task = Task(task_number=task_number, description=description, 
                    duration=duration, priority_score=priority_score, 
                    scheduled_start=scheduled_start, scheduled_finish=scheduled_finish, is_completed=is_completed, 
                    previous_task_id=previous_task_id, next_task_id=next_task_id, is_recurring=is_recurring, 
                    dependencies=dependencies, last_updated=last_updated, tag=tag, objective_id=objective_id)
        db.session.add(task)
        db.session.commit()
        resp_dict["message"] = "Success: Added Task to db!"
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
    resp_dict = {"message":""} 
    user_id = session["userId"]
    task = Task.query.filter_by(id=task_id).first()

    if not task:
        resp_dict["message"] = "Failure: The task referenced does not exist."
        return jsonify(resp_dict), 404  

    objective = Objective.query.filter_by(id=task.objective_id).first() #task will definitely belong to an objective as is a condition creating a task
    project = Project.query.filter_by(id=objective.project_id, user_id=user_id).first()
    if not project:
        resp_dict["message"] = "Failure: The task referenced does not belong to user."
        return jsonify(resp_dict), 403

    content = request.json
    task.description = content.get("description", task.description)
    task.duration = content.get("duration", task.duration)
    task.priority_score = content.get("priorityScore", task.priority_score)
    task.scheduled_start = content.get("scheduledStart", task.scheduled_start)
    task.scheduled_finish = content.get("scheduledFinish", task.scheduled_finish)
    task.is_completed = content.get("isCompleted", task.is_completed)
    task.previous_task_id = content.get("previousTaskId", task.previous_task_id)
    task.next_task_id = content.get("nextTaskId", task.next_task_id)
    task.is_recurring = content.get("isRecurring", task.is_recurring)
    task.dependencies = content.get("dependencies", task.dependencies)
    task.last_updated = datetime.now(tz=timezone.utc)
    task.tag = content.get("tag", task.tag)
    task.objective_id = content.get("objectiveId", task.objective_id)

    if len(task.description) > int(task_description_limit):
        resp_dict["message"] = f"Failure: The task description is over the {task_description_limit} char limit."
        return jsonify(resp_dict), 400

    if isinstance(task.scheduled_start, str):
        task.scheduled_start = datetime.strptime(task.scheduled_start, '%Y-%m-%dT%H:%M:%S.%fZ')

    if isinstance(task.scheduled_finish, str):
        task.scheduled_finish = datetime.strptime(task.scheduled_finish, '%Y-%m-%dT%H:%M:%S.%fZ')  

    try:
        db.session.commit()
        resp_dict["message"] = "Success: Task has been updated!"
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



