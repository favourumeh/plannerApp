#This handles all the project routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session, request
from flask_sqlalchemy.query import Query
from flask_sqlalchemy.pagination import Pagination
from models import Project, Objective, Task
from plannerPackage import login_required, token_required, generate_entity_number, generate_all_project_content, convert_date_str_to_datetime
from config import db, app, serializer
from typing import Tuple, List, Dict
from datetime import datetime
from pytz import timezone

#create blueprint
project = Blueprint("project", __name__, url_prefix="/api/")

#import env vars from b/.env
load_dotenv()

#key params
project_title_limit = int(os.environ["project_title_limit"])


#projects routes 

#create
@project.route("/create-project", methods=["POST"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_project() -> Tuple[Response, int]:
    resp_dict = {"message":""}
    content: Dict = request.json
    project_number: int = content.get("projectNumber", None)
    status: str = content.get("status", "To-Do")
    title: str = content.get("title", None)
    description: str = content.get("description", None)
    deadline: datetime = content.get("deadline", None)
    scheduled_start: str|None = content.get("scheduledStart", None)
    scheduled_finish: str|None = content.get("scheduledFinish", None) 
    last_updated: datetime = datetime.now(tz=timezone('Europe/London'))
    tag: str = content.get("tag", None)
    user_id: int = session["userId"] 
    
    if not description:
        resp_dict["message"] = "Failure: Project is missing a description. Please add one."
        return jsonify(resp_dict), 400

    if not title:
        resp_dict["message"] = "Failure: Project is missing a title. Please add one."
        return jsonify(resp_dict), 400
    
    if len(title) > project_title_limit:
        resp_dict["message"] = f"Failure: The title has over {project_title_limit} chars"
        return jsonify(resp_dict), 400

    user_projects: List[Project] = Project.query.filter_by(user_id=user_id).all()
    project_titles: List[str] = [project.title for project in user_projects]
    if title in project_titles:
        resp_dict["message"] = "Failure: The project title provided already exists for this user. Please provide a different title."
        return jsonify(resp_dict), 400
    
    deadline = convert_date_str_to_datetime(deadline, '%Y-%m-%d')
    scheduled_start = convert_date_str_to_datetime(scheduled_start, '%Y-%m-%d')
    scheduled_finish = convert_date_str_to_datetime(scheduled_finish, '%Y-%m-%d')

    project_number = generate_entity_number(entity_number=project_number, parent_entity_id=user_id, parent_entity_name="user", entity_name="project", entity=Project)

    try:
        project = Project(project_number=project_number, status=status, title=title, description=description, deadline=deadline, 
                          scheduled_start=scheduled_start, scheduled_finish=scheduled_finish, last_updated=last_updated, tag=tag, user_id=user_id)
        db.session.add(project)
        project_id = Project.query.filter_by(title=title, user_id=user_id).first().id
        objective_desc = "Stores all project tasks that do not belong to an objective"
        default_objective = Objective(title="No Objective", type="default user project objective", objective_number=0, description=objective_desc, project_id=project_id)
        db.session.add(default_objective)
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
        projects = Project.query.filter_by(user_id=session["userId"]).all()
        resp_dict["projects"] = [project.to_dict() for project in projects]
        resp_dict["message"] = "Success: user's projects loaded"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user's projects! Reason: {e}"
        return jsonify(resp_dict), 404

    # Query read-projects   
@project.route("/query-projects", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def query_projects(): 
    resp_dict = {"message":"", "projects":""}
    user_id: int = session["userId"]
    query: Query = Project.query.filter(Project.user_id == user_id) #users_projects

    #query params
    pagination = None
    page: int = request.args.get("page", default=None, type=int)
    per_page: int = request.args.get("perPage", default=None, type=int)
    status: int = request.args.get("status", default=None, type=str)

    if status:
        query: Query = query.filter(Project.status == status)
        resp_dict["_status"] = status

    if page and per_page:
        pagination: Pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        resp_dict["_pages"] = pagination.pages
        resp_dict["_currentPage"] = pagination.page
        resp_dict["_perPage"] = pagination.per_page
        resp_dict["_hasNext"] = pagination.has_next
        resp_dict["_hasPrev"] = pagination.has_prev
    try:
        projects: List[Project] = pagination.items if pagination else query.all()
        resp_dict["message"] = "Success: user's projects loaded"
        resp_dict["projects"] = [project.to_dict() for project in projects]
        resp_dict["_itemCount"] = len(projects)
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not read user project! Reason: {e}"
        return jsonify(resp_dict), 404

@project.route("/get-project-progress/<int:project_id>", methods=["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def get_project_progress(project_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""}
    user_id: int = session["userId"]
    
    project: Project = Project.query.filter_by(id=project_id).first()
    if not project:
        resp_dict["message"] = "Failure: The requested project is not in the database. Choose another one."
        return jsonify(resp_dict), 404
    
    project: Project = Project.query.filter_by(id=project_id, user_id=user_id).first()
    if not project:
        resp_dict["message"] = "Failure: The requested project does not belong to the user. Choose another one."
        return jsonify(resp_dict), 403

    project_tasks_query: Query = Task.query.join(Objective).filter(Objective.project_id==project_id, Objective.type!="break")
    tasks: List[Task] = project_tasks_query.all()
    total_task_count: int = len(tasks)
    total_task_duration: int = sum([task.duration if isinstance(task.duration, int) else task.duration_est for task in tasks])
    completed_tasks: List[Task] = project_tasks_query.filter(Task.status=="Completed").all()
    completed_tasks_count: int = len(completed_tasks)
    completed_tasks_duration: int = sum([completed_task.duration if isinstance(completed_task.duration, int) else 0 for completed_task in completed_tasks])
    progress_percentage_count: float = (completed_tasks_count / total_task_count * 100) if total_task_count > 0 else 0.0
    progress_percentage_duration: float = (completed_tasks_duration * 100 / total_task_duration ) if total_task_duration > 0 else 0.0

    resp_dict["message"] = "Success: Projects's progress retrieved."
    resp_dict["projectName"] = project.title
    resp_dict["progressPercentageCount"] = progress_percentage_count
    resp_dict["progressPercentageDuration"] = progress_percentage_duration
    resp_dict["totalTaskCount"] = total_task_count
    resp_dict["completedTaskCount"] = completed_tasks_count
    resp_dict["totalTaskDuration"] = total_task_duration
    resp_dict["completedTaskDuration"] = completed_tasks_duration
    return jsonify(resp_dict), 200

#update
@project.route("/update-project/<int:project_id>", methods=["PATCH"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_project(project_id: int) -> Tuple[Response, int]: 
    resp_dict = {"message":""}
    content: Dict = request.json
    user_id: int = session["userId"]
    project = Project.query.filter_by(id=project_id, user_id=user_id).first()

    if not project:
        resp_dict["message"] = "Failure: Could not find the selected project in the db. Please choose another project id."
        return jsonify(resp_dict), 404

    if project.type == "default project":
        resp_dict["message"] = "Failure: User is attempting to edit the default project which is not allowed."
        return jsonify(resp_dict), 403
    
    project.title = content.get("title", project.title)
    project.description = content.get("description", project.description)
    project.status = content.get("status", project.status)
    deadline: str|None = content.get("deadline", project.deadline)
    scheduled_start: str|None = content.get("scheduledStart", project.scheduled_start)
    scheduled_finish: str|None = content.get("scheduledFinish", project.scheduled_finish) 
    project.last_updated = datetime.now(tz=timezone('Europe/London'))
    project.tag = content.get("tag", project.tag)

    if not project.title:
        resp_dict["message"] = "Failure: Project is missing a title. Please add one."
        return jsonify(resp_dict), 400
    
    if len(project.title) > project_title_limit:
        resp_dict["message"] = f"Failure: The title has over {project_title_limit} chars"
        return jsonify(resp_dict), 400
    
    user_projects: List[Project] = Project.query.filter(Project.user_id == user_id, Project.id != project.id).all()
    project_titles: List[str] = [project.title for project in user_projects]
    if project.title in project_titles:
        resp_dict["message"] = "Failure: The project title provided already exists for this user. Please provide a different title."
        return jsonify(resp_dict), 400

    project.deadline = convert_date_str_to_datetime(deadline, '%Y-%m-%d')
    project.scheduled_start = convert_date_str_to_datetime(scheduled_start, '%Y-%m-%d')
    project.scheduled_finish = convert_date_str_to_datetime(scheduled_finish, '%Y-%m-%d')

    if project.type in ["default project"]:
        resp_dict["message"] = "Failure: User is attempting to update a default project which is not allowed."
        return jsonify(resp_dict),  403

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
    user_id: int = session["userId"]
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        resp_dict["message"] = "Failure: The project you are trying to delete does not exist"
        return jsonify(resp_dict), 404

    project = Project.query.filter(db.and_(Project.id == project_id, Project.user_id == user_id)).first()
    if not project:
        resp_dict["message"] = "Failure: The project you are trying to delete does not belong to the user"
        return jsonify(resp_dict), 403

    if project.type == "default project":
        resp_dict["message"] = "Failure: User is attempting to delete the default project which is not allowed."
        return jsonify(resp_dict), 403

    objectives: Query = Objective.query.filter(Objective.project_id == project.id) #deleting all objectives that belong to the project
    objective_ids: List[int] = [objective.id for objective in objectives.all()]
    tasks: Query = Task.query.filter(Task.objective_id.in_(objective_ids))

    try:
        tasks.delete()
        objectives.delete()
        db.session.delete(project)
        db.session.commit()
        resp_dict["message"] = "Success: The project was successfully deleted!"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: Could not delete the project! Reason: {e}"
        return jsonify(resp_dict), 404
    




