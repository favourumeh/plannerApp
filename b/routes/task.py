#This handles all the task routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session
from models import User
from plannerPackage import login_required, token_required, filter_dict
from config import db, app, serializer
from typing import Tuple
from datetime import datetime, timezone, timedelta

#create blueprint
task = Blueprint("task", __name__)

#import env vars from b/.env
load_dotenv()

#tasks routes 
#create
@task.route("/create-task", methods="POST")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_task() -> Tuple[Response, int]:
    pass
    
#read
@task.route("/get-tasks", methods="GET")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_tasks(): 
    pass

#update
@task.route("/edit-task/<int:task_id>", methods="PATCH")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_task(task_id: int) -> Tuple[Response, int]: 
    pass

#delete
@task.route("/delete-task/<int:task_id>", methods="DELETE")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_task(task_id: int) -> Tuple[Response, int]:
    pass



