#This handles all the objective routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from flask_sqlalchemy.query import Query
from flask_sqlalchemy.pagination import Pagination
from models import Project, Objective, Task
from plannerPackage import login_required, token_required, flatten_2d_list, generate_entity_number, convert_date_str_to_datetime
from config import db, app, serializer
from typing import Tuple, List
from datetime import datetime
from pytz import timezone

#create blueprint
objective = Blueprint("objective", __name__)

#import env vars from b/.env
load_dotenv()

#key params 
objective_title_limit = int(os.environ["objective_title_limit"])

#create
@objective.route("/create-objective", methods=["POST"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_objective() -> Tuple[Response, int]:
    resp_dict = {"message":""}
    content: dict = request.json
    objective_number: int = content.get("objectiveNumber", None)
    status: str = content.get("status", "To-Do")
    title: str = content.get("title", None)
    description: str = content.get("description", None)
    deadline: str|None = content.get("deadline", None)
    scheduled_start: str|None = content.get("scheduledStart", None)
    scheduled_finish: str|None = content.get("scheduledFinish", None) 
    last_updated: datetime = datetime.now(tz=timezone('Europe/London'))
    tag: str = content.get("tag", None)
    project_id: int = content.get("projectId", None)
    user_id: int = session["userId"] 
    
    if not project_id:
        resp_dict["message"] = "Failure: Objective is missing a project ID. Please add one!"
        return jsonify(resp_dict), 400
    
    project  = Project.query.filter_by(id=project_id, user_id=user_id).first()
    if not project:
        resp_dict["message"] = "Failure: User does not have any project in the db with the project ID provided."
        return jsonify(resp_dict), 404
    
    type = "free objective" if project.type == "default project" else "project objective"
        
    if not title:
        resp_dict["message"] = "Failure: objective is missing a title. Please add one."
        return jsonify(resp_dict), 400

    if len(title) > objective_title_limit:
        resp_dict["message"] = f"Failure: The title has over {objective_title_limit} chars"
        return jsonify(resp_dict), 400

    project_objectives: List[Objective] = Objective.query.filter_by(project_id=project_id).all()
    objective_titles: List[str] = [objective.title for objective in project_objectives]
    if title in objective_titles:
        resp_dict["message"] = "Failure: The title provided already exists in the project. Please provide a different title."
        return jsonify(resp_dict), 400
    
    #generate objective number if not provided
    objective_number = generate_entity_number(entity_number=objective_number, parent_entity_id=project_id, parent_entity_name="project", entity_name="objective", entity=Objective)

    deadline = convert_date_str_to_datetime(deadline, '%Y-%m-%d')
    scheduled_start = convert_date_str_to_datetime(scheduled_start, '%Y-%m-%d')
    scheduled_finish = convert_date_str_to_datetime(scheduled_finish, '%Y-%m-%d')

    try:
        objective: Objective = Objective(objective_number=objective_number, status=status, type=type, title=title, description=description,
                                         deadline=deadline, scheduled_start=scheduled_start, scheduled_finish=scheduled_finish, last_updated=last_updated, 
                                         tag=tag, project_id=project_id)
        db.session.add(objective)
        db.session.commit()
        resp_dict["message"] = "Success: objective Added!"
        return jsonify(resp_dict), 201
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not add the objective to the db! Reason: {e}"
        return jsonify(resp_dict), 404

#read
@objective.route("/read-objectives", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_objectives(): 
    resp_dict = {"message":"", "objectives":""}
    user_id: int = session["userId"]
    projects: List[Project] = Project.query.filter_by(user_id=user_id).all() #remember: each user has at least one project: the default project that is created on sign up
    try:
        objectives: List[List[Objective]] = [Objective.query.filter_by(project_id=project.id).all() for project in projects]
        objectives_flattened: List[Objective] = flatten_2d_list(objectives)
        resp_dict["objectives"] = [objective.to_dict() for objective in objectives_flattened] #List[Dict]
        resp_dict["message"] = "Success: user's objectives loaded"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user's objectives! Reason: {e}"
        return jsonify(resp_dict), 404

    # Query read-objectives   
@objective.route("/query-objectives", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def query_objectives(): 
    resp_dict = {"message":"", "objectives":""}
    user_id: int = session["userId"]
    query: Query = Objective.query.join(Project).filter(Project.user_id == user_id) #users_objectives

    #query params
    pagination = None
    page: int = request.args.get("page", default=None, type=int)
    per_page: int = request.args.get("perPage", default=None, type=int)
    project_id: int = request.args.get("projectId", default=None, type=int)
    objective_id: int = request.args.get("objectiveId", default=None, type=int)
    status: int = request.args.get("status", default=None, type=str)
    type: str = request.args.get("type", default=None, type=str)
    if project_id:
        query: Query = query.filter(Objective.project_id == project_id)
        resp_dict["_projectId"] = project_id
    if status:
        query: Query = query.filter(Objective.status == status)
        resp_dict["_status"] = status
    if type:
        query: Query = query.filter(Objective.type == type)
        resp_dict["_type"] = type
        break_objective: Objective = query.first() 
        resp_dict["breakObjective"] = break_objective.to_dict()
    if page and per_page:
        pagination: Pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        resp_dict["_pages"] = pagination.pages
        resp_dict["_currentPage"] = pagination.page
        resp_dict["_perPage"] = pagination.per_page
        resp_dict["_hasNext"] = pagination.has_next
        resp_dict["_hasPrev"] = pagination.has_prev
    try:
        objectives: List[Objective] = pagination.items if pagination else query.all()
        resp_dict["message"] = "Success: user's objectives loaded"
        resp_dict["objectives"] = [objective.to_dict() for objective in objectives]
        resp_dict["_itemCount"] = len(objectives)
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user objective! Reason: {e}"
        return jsonify(resp_dict), 404

    #get the project dict of an objective
@objective.route("/get-objectives-project/<int:objective_id>", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def get_objectives_project(objective_id: int): 
    resp_dict = {"message":""}
    user_id: int = session["userId"]
    users_objectives: Query = Objective.query.join(Project).filter(Project.user_id == user_id) #users_objectives

    objective: Objective = Objective.query.filter(Objective.id == objective_id).first()
    if not objective:
        resp_dict["message"] = "Failure: The requested objective is not in the database. Choose another one."
        return jsonify(resp_dict), 404
    
    objective: Objective = users_objectives.filter(Objective.id == objective_id).first()
    if not objective:
        resp_dict["message"] = "Failure: The requested objective does not belong to the user. Choose another one."
        return jsonify(resp_dict), 403

    project: Project = Project.query.filter(Project.id == objective.project_id).first()
    resp_dict["message"] = "Success: Objective's project was retrieved."
    resp_dict["objective"] = objective.to_dict()
    resp_dict["project"] = project.to_dict()
    return jsonify(resp_dict), 200

#update
@objective.route("/update-objective/<int:objective_id>", methods=["PATCH"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_objective(objective_id: int) -> Tuple[Response, int]: 
    resp_dict = {"message":""}
    user_id: int = session["userId"] 
    content = request.json
    
    objective = Objective.query.filter_by(id=objective_id).first()
    
    if not objective:
        resp_dict["message"] = "Failure: Could not find the selected objective."
        return jsonify(resp_dict), 404

    project = Project.query.filter_by(id=objective.project_id, user_id=user_id).first()
    
    if not project:
        resp_dict["message"] = "Failure: The objective selected does not belong to the user."
        return jsonify(resp_dict)

    objective.status = content.get("status", objective.status)
    objective.title = content.get("title", objective.title)
    objective.description = content.get("description", objective.description)
    deadline = content.get("deadline", objective.deadline)
    scheduled_start: str|None = content.get("scheduledStart", objective.scheduled_start)
    scheduled_finish: str|None = content.get("scheduledFinish", objective.scheduled_finish) 
    objective.last_updated = datetime.now(tz=timezone('Europe/London'))
    objective.tag = content.get("tag", objective.tag)
    project_id = content.get("projectId", objective.project_id)
    
    objective.deadline = convert_date_str_to_datetime(deadline, '%Y-%m-%d')
    objective.scheduled_start = convert_date_str_to_datetime(scheduled_start, '%Y-%m-%d')
    objective.scheduled_finish = convert_date_str_to_datetime(scheduled_finish, '%Y-%m-%d')
    
    if len(objective.title) > objective_title_limit:
        resp_dict["message"] = f"Failure: The title has over {objective_title_limit} chars"
        return jsonify(resp_dict), 400

    #check if the objective title update shares the same title as another objective in the project
    project_objectives: List[Objective] = Objective.query.filter(Objective.project_id == project_id, Objective.id != objective.id ).all()
    objective_titles: List[str] = [objective.title for objective in project_objectives] # excludes the current objective being updated
    if objective.title in objective_titles:
        resp_dict["message"] = "Failure: The title provided already exists in the project. Please provide a different title."
        return jsonify(resp_dict), 400

   #Check if objective being updated already exist in the objective
    existing_objective = Objective.query.filter_by(id=objective_id, project_id=project_id).first()
    if not existing_objective: # if no existing objective is found in the project, it means the objective is being moved from another project
        objective.objective_number = generate_entity_number(entity_number=None, parent_entity_id=project_id, parent_entity_name="project", entity_name="objective", entity=Objective)
        objective.project_id = project_id 
        
    if objective.type in ["default user project objective", "default project objective"]:
        resp_dict["message"] = "Failure: User is attempting to update a default objective which is not allowed."
        return jsonify(resp_dict),  403

    try:
        db.session.commit()
        resp_dict["message"] = "Success: Objective has been updated."
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not update the objective! Reason: {e}"
        return jsonify(resp_dict), 404

#delete
@objective.route("/delete-objective/<int:objective_id>", methods=["DELETE"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_objective(objective_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""}
    user_id: int = session["userId"]

    objective = Objective.query.filter_by(id=objective_id).first()
    if not objective:
        resp_dict["message"] = "Failure: The objective you are trying to delete does not exist."
        return jsonify(resp_dict), 404
    
    project = Project.query.filter_by(id=objective.project_id, user_id=user_id).first()
    if not project:
        resp_dict["message"] = "Failure: The objective selected does not belong to the user."
        return jsonify(resp_dict), 403

    if objective.type in ["default user project objective", "default project objective"]:
        resp_dict["message"] = "Failure: User is attempting to delete a default objective which is not allowed."
        return jsonify(resp_dict),  403
    
    # tasks: List[Task] = Task.query.filter_by(objective_id=objective_id).delete()
    try:
        Task.query.filter_by(objective_id=objective_id).delete()
        db.session.delete(objective)
        db.session.commit()
        resp_dict["message"] = "Success: The objective -- and its tasks -- were successfully deleted!"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not delete the objective! Reason: {e}"
        return jsonify(resp_dict), 404



