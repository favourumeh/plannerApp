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
               "userId": cls.user_id}
                
class Project(db.Model):
    """Defines the properties of the 'Project' entity: id, type, status, title, description, deadline, tag, user_id"""
    id = db.Column(db.Integer, primary_key=True)
    project_number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(20), default="user project") # 2 types: "default project" and "user project" 
    status = db.Column(db.String(50), default="To-Do") # 3 types = To-Do, In-Progress and Completed
    title = db.Column(db.String(80), default="Unnamed Project")
    description = db.Column(db.Text, nullable=False)
    deadline = db.Column(db.Date)   #can be directly set or derived from objectives
    predicted_finish = db.Column(db.Date) #when user finishes based on 
    scheduled_start = db.Column(db.Date)
    scheduled_finish = db.Column(db.Date)
    date_added = db.Column(db.DateTime(timezone=True), default=func.now())
    last_updated = db.Column(db.DateTime(timezone=True), default=func.now())
    tag = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    db.relationship("Objective")
    
    def __repr__(cls) -> str:
        return f'<Project {cls.id}: {cls.title[:20]}...>'
    
    def to_dict(cls) -> Dict:
        return {"id": cls.id,
                "projectNumber": cls.project_number,
                "type": cls.type,
                "status": cls.status, 
                "title": cls.title,
                "description": cls.description,
                "deadline": cls.deadline,
                "predictedFinish": cls.predicted_finish,
                "scheduledStart": cls.scheduled_start,
                "scheduledFinish": cls.scheduled_finish,
                "dateAdded": cls.date_added,
                "lastUpdated": cls.last_updated,
                "tag": cls.tag,
                "userId": cls.user_id}

class Objective(db.Model):
    """Defines the properties of the 'Objective' entity: id, objective_number, type, status, title, description, duration, scheduled_start/finish, tag, project_id"""
    id = db.Column(db.Integer, primary_key=True)
    objective_number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(40), default="project objective") # 4 types: "free objective" and "project objective", default project objective and "default user project objective"
    status = db.Column(db.String(50), default="To-Do") # 3 types = To-Do, In-Progress and Completed
    title = db.Column(db.String(80), default=f"Project {id}")
    description = db.Column(db.Text)
    duration = db.Column(db.Integer)  #hours
    deadline = db.Column(db.Date) #can be directly set or derived 
    predicted_finish = db.Column(db.Date) #determines when user finishes based on their current progress and remaining tasks
    scheduled_start = db.Column(db.Date)
    scheduled_finish = db.Column(db.Date)
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
                "status": cls.status, 
                "title": cls.title,
                "description": cls.description,
                "duration": cls.duration,
                "deadline": cls.deadline,
                "predictedFinish": cls.predicted_finish,
                "scheduledStart": cls.scheduled_start,
                "scheduledFinish": cls.scheduled_finish,
                "dateAdded": cls.date_added,
                "lastUpdated": cls.last_updated,
                "tag": cls.tag,
                "projectId": cls.project_id}

class Task(db.Model):
    """Defines the properties of the 'Task' entity: id, task_number, type, status, description, duration, priorityScore, scheduled_start/finish, start/finish, 
    previous/next_task_id, is_recurring, is_cancelled, dependencies, was_paused, tag, objective_id"""
    id = db.Column(db.Integer, primary_key=True)
    task_number = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String(12), default="project task") # 2 types: "free task" and "project task"
    status = db.Column(db.String(50), default="To-Do") #4 tpoes: To-Do, In-Progress, Paused and Completed
    description = db.Column(db.String(100))
    duration = db.Column(db.Integer, nullable=False) # minutes
    priority_score = db.Column(db.Integer, default=1)
    scheduled_start = db.Column(db.Date)
    start = db.Column(db.DateTime(timezone=True))
    finish = db.Column(db.DateTime(timezone=True))
    is_recurring = db.Column(db.Boolean, default=False)
    is_cancelled = db.Column(db.Boolean, default=False)
    date_added = db.Column(db.DateTime(timezone=True), default=func.now())
    last_updated = db.Column(db.DateTime(timezone=True), default=func.now())
    was_paused = db.Column(db.Boolean, default=False)
    parent_task_id = db.Column(db.Integer)
    tag = db.Column(db.String(40))
    objective_id = db.Column(db.Integer, db.ForeignKey("objective.id"), nullable=False)

    def __repr__(cls) -> str:
        return f'<Task {cls.id}: {cls.description[:20]}...>'
    
    def to_dict(cls) -> Dict:
        return {"id": cls.id,
                "taskNumber": cls.task_number,
                "type": cls.type,
                "status": cls.status,
                "description": cls.description,
                "duration": cls.duration,
                "priorityScore": cls.priority_score,
                "scheduledStart": cls.scheduled_start,
                "start": cls.start,
                "finish": cls.finish,
                "isRecurring":cls.is_recurring,
                "isCancelled":cls.is_cancelled,
                "dateAdded": cls.date_added,
                "lastUpdated": cls.last_updated,
                "wasPaused": cls.was_paused,
                "parentTaskId": cls.parent_task_id,
                "tag": cls.tag,
                "objectiveId": cls.objective_id}