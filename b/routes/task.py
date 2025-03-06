#This handles all the task routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from models import User, Project, Objective, Task
from plannerPackage import login_required, token_required, flatten_2d_list, generate_task_number
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
    user_id = session["userID"]
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
        
    task_number = generate_task_number(task_number=task_number, objective_id=objective_id, Task=Task)

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
    user_id = session["userID"]
    try:
        user_projects: List[Project] = Project.query.filter_by(user_id = user_id).all() # a default project is created on user signs up
        user_project_ids: List[int] = [project.id for project in user_projects]
        user_objectives: List[List[Objective]] = [Objective.query.filter_by(project_id=id).all() for id in user_project_ids] # a default objective is created on a project's creation
        user_objectives_flattened: List[Objective] = flatten_2d_list(user_objectives)
        user_objective_ids: List[int] = [user_objective.id for user_objective in user_objectives_flattened]
        user_tasks: List[List[Task]] =  [Task.query.filter_by(objective_id=id).all() for id in user_objective_ids]
        user_tasks_flattened: List[Task] = flatten_2d_list(user_tasks)
        resp_dict["message"] = "Success: User Tasks extracted"
        resp_dict["tasks"] = [task.to_dict() for task in user_tasks_flattened]
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user task! Reason: {e}"
        return jsonify(resp_dict), 404
    pass

#update
@task.route("/update-task/<int:task_id>", methods=["PATCH"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_task(task_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""} 
    user_id = session["userID"]
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
    user_id = session["userID"]
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
        resp_dict["message"] = "Success: The task was delete!"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = "Failure: The task could not be delete"
        return jsonify(resp_dict), 404



