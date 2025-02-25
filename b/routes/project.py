#This handles all the project routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from models import Project
from plannerPackage import login_required, token_required
from config import db, app, serializer
from typing import Tuple
from datetime import datetime, timezone

#create blueprint
project = Blueprint("project", __name__)

#import env vars from b/.env
load_dotenv()

#projects routes 

#create
@project.route("/create-project", methods=["POST"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_project() -> Tuple[Response, int]:
    resp_dict = {"message":""}
    content: dict = request.json
    title: str = content.get("title", "Unnamed Project")
    description: str = content.get("description", None)
    is_completed: bool = content.get("isCompleted", False)
    deadline: datetime = content.get("deadline", None)
    last_updated: datetime = datetime.now(tz=timezone.utc)
    tag: str = content.get("tag", None)
    user_id: int = session["userID"] 
    
    project_title_limit = int(os.environ["project_title_limit"])
    if not description:
        resp_dict["message"] = "Failure: Project is missing a description. Please add one."
        return jsonify(resp_dict), 400

    if len(title) > project_title_limit:
        resp_dict["message"] = f"Failure: The title has over {project_title_limit} chars"
        return jsonify(resp_dict), 400

    if isinstance(deadline, str): #if string then value is from request otherwise its from db
        deadline = datetime.strptime(deadline, '%Y-%m-%dT%H:%M:%S.%fZ') #converts str date (format e.g., 2024-11-26T09:18:14.687Z) to dt

    try:
        project: Project = Project(title=title, description=description, is_completed=is_completed, deadline=deadline, last_updated=last_updated, tag=tag, user_id=user_id)
        db.session.add(project)
        db.session.commit()
        resp_dict["message"] = "Success: Project Added!"
        return jsonify(resp_dict), 201
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not add the project to the db! Reason: {e}"
        return jsonify(resp_dict), 404
    
#read
@project.route("/read-projects", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_projects(): 
    resp_dict = {"message":"", "projects":""}
    try:
        projects = Project.query.filter_by(user_id=session["userID"]).all()
        resp_dict["projects"] = [project.to_dict() for project in projects]
        resp_dict["message"] = "Success: loading projects"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user's projects! Reason: {e}"
        return jsonify(resp_dict), 404

#update
@project.route("/update-project/<int:project_id>", methods=["PATCH"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_project(project_id: int) -> Tuple[Response, int]: 
    resp_dict = {"message":""}
    content: dict = request.json
    project = Project.query.filter_by(id=project_id, user_id=session["userID"]).first()

    if not project:
        resp_dict["message"] = "Failure: Could not find the selected project in the db. Please choose another project id."
        return jsonify(resp_dict), 404

    if project.type == "default project":
        resp_dict["message"] = "Failure: User is attempting to edit the default project which is not allowed."
        return jsonify(resp_dict), 403
    
    project.title = content.get("title", project.title)
    project.description = content.get("description", project.description)
    project.is_completed = content.get("isCompleted", project.is_completed)
    deadline = content.get("deadline", project.deadline)
    project.last_updated = datetime.now(tz=timezone.utc)
    project.tag = content.get("tag", project.tag)
    
    if isinstance(deadline, str):
        project.deadline = datetime.strptime(deadline, '%Y-%m-%dT%H:%M:%S.%fZ')
    
    try:
        db.session.commit()
        resp_dict["message"] = "Success: Project has been updated."
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not update the project! Reason: {e}"
        return jsonify(resp_dict), 404
        

#delete
@project.route("/delete-project/<int:project_id>", methods=["DELETE"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_project(project_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""}
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        resp_dict["message"] = "Failure: The project you are trying to delete does not exist"
        return jsonify(resp_dict), 404
    
    if project.type == "default project":
        resp_dict["message"] = "Failure: User is attempting to delete the default project which is not allowed."
        return jsonify(resp_dict), 403
    
    try:
        db.session.delete(project)
        db.session.commit()
        resp_dict["message"] = "Success: The project was successfully deleted!"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not delte the project! Reason: {e}"
        return jsonify(resp_dict), 404
    



