from flask_login import UserMixin
from typing import Dict
from sqlalchemy.sql import func
from flask_sqlalchemy import SQLAlchemy

#instantiate the database instance 
db = SQLAlchemy()

class User(db.Model, UserMixin):
    "Defines the properties of the User entity such as id, username, password, email, date_added, last_updated, is_admin"
    id = db.Column(db.Integer, primary_key=True)
    username= db.Column(db.String(15), nullable=False, unique=True)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=True , unique=True)
    date_added = db.Column(db.DateTime(timezone=True), default=func.now())
    last_updated = db.Column(db.DateTime(timezone=True), default=func.now())
    is_admin = db.Column(db.Boolean, default=False)
    token = db.relationship("Refresh_Token")
    projects = db.relationship("Project")
    
    def __repr__(cls) -> str:
        return f'<"User "{cls.username}">'
    
    def to_dict(cls) -> Dict:
        return {"id": cls.id,
                "username": cls.username,
                "password": cls.password,
                "email": cls.email,
                "dateAdded": cls.date_added,
                "isAdmin": cls.is_admin,
                "lastUpdated": cls.last_updated}

class Refresh_Token(db.Model):
    """Defines the properites of the Refresh_Token entity: id, token,exp, user_id"""
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(250), nullable =False)
    exp = db.Column(db.DateTime(timezone=True), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    
    def __repr__(cls) -> str:
        return f'<Refresh_Token "user = {cls.user_id}">'
            
    def to_dict(cls) -> Dict:
        return{"id": cls.id,
               "token": cls.token,
               "exp": f"{cls.exp}",
               "user_id": cls.user_id}
                
class Project(db.Model):
    """Defines the properties of the 'Project' entity: id, type, title, description, is_completed, deadline, tag, user_id"""
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), default="user project") # 2 types: "default project" and "user project" 
    title = db.Column(db.String(80), default="Unnamed Project")
    description = db.Column(db.Text, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    deadline = db.Column(db.DateTime(timezone=True))
    date_added = db.Column(db.DateTime(timezone=True), default=func.now())
    last_updated = db.Column(db.DateTime(timezone=True), default=func.now())
    tag = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    db.relationship("Objective")
    
    def __repr__(cls) -> str:
        return f'<Project {cls.id}: {cls.title[:20]}...>'
    
    def to_dict(cls) -> Dict:
        return {"id": cls.id,
                "type": cls.type,
                "title": cls.title,
                "description": cls.description,
                "isCompleted": cls.is_completed,
                "deadline": cls.deadline,
                "dateAdded": cls.date_added,
                "lastUpdated": cls.last_updated,
                "tag": cls.tag,
                "userID": cls.user_id}

class Objective(db.Model):
    """Defines the properties of the 'Objective' entity: id, objective_number, type, title, description, duration, scheduled_start/finish, is_completed, tag, project_id"""
    id = db.Column(db.Integer, primary_key=True)
    objective_number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(20), default="project objective") # 2 types: "free objective" and "project objective"
    title = db.Column(db.String(80), default=f"Project {id}")
    description = db.Column(db.Text)
    duration = db.Column(db.Integer)  #hours
    scheduled_start = db.Column(db.DateTime(timezone=True))
    scheduled_finish = db.Column(db.DateTime(timezone=True))
    is_completed = db.Column(db.Boolean, default=False)
    date_added = db.Column(db.DateTime(timezone=True), default=func.now())
    last_updated = db.Column(db.DateTime(timezone=True), default=func.now())
    tag = db.Column(db.String(40))
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    db.relationship("Task")

    def __repr__(cls) -> str:
        return f'<Objective {cls.id}: {cls.title[:20]}...>'
    
    def to_dict(cls) -> Dict:
        return {"id": cls.id,
                "objectiveNumber": cls.objective_number,
                "type": cls.type,
                "title": cls.title,
                "description": cls.description,
                "duration": cls.duration,
                "scheduledStart": cls.scheduled_start,
                "scheduledFinish": cls.scheduled_finish,
                "isCompleted": cls.is_completed,
                "dateAdded": cls.date_added,
                "lastUpdated": cls.last_updated,
                "tag": cls.tag,
                "projectID": cls.project_id}


class Task(db.Model):
    """Defines the properties of the 'Task' entity: id, task_number, type, description, duration, first_task, precedence_score, scheduled_start/finish, is_completed, tag, objective_id"""
    id = db.Column(db.Integer, primary_key=True)
    task_number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(12), default="project task") # 2 types: "free task" and "project task"
    description = db.Column(db.String(100))
    duration = db.Column(db.Integer, nullable=False) # minutes
    first_task = db.Column(db.Boolean, default=False) 
    precedence_score = db.Column(db.Integer, default=1)
    scheduled_start = db.Column(db.DateTime(timezone=True))
    scheduled_finish = db.Column(db.DateTime(timezone=True))
    is_completed = db.Column(db.Boolean, default=False)
    date_added = db.Column(db.DateTime(timezone=True), default=func.now())
    last_updated = db.Column(db.DateTime(timezone=True), default=func.now())
    tag = db.Column(db.String(40))
    objective_id = db.Column(db.Integer, db.ForeignKey("objective.id"), nullable=False)

    def __repr__(cls) -> str:
        return f'<Task {cls.id}: {cls.description[:20]}...>'
    
    def to_dict(cls) -> Dict:
        return {"id": cls.id,
                "taskNumber": cls.task_number,
                "type": cls.type,
                "description": cls.description,
                "duration": cls.duration,
                "firstTask": cls.first_task,
                "precedenceScore": cls.precedence_score,
                "scheduledStart": cls.scheduled_start,
                "scheduledFinish": cls.scheduled_finish,
                "isCompleted": cls.is_completed,
                "dateAdded": cls.date_added,
                "lastUpdated": cls.last_updated,
                "tag": cls.tag,
                "objectiveID": cls.objective_id}