#This handles all the project routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session
from models import User
from plannerPackage import login_required, token_required, filter_dict
from config import db, app, serializer
from typing import Tuple
from datetime import datetime, timezone, timedelta

#create blueprint
project = Blueprint("project", __name__)

#import env vars from b/.env
load_dotenv()

#projects routes 
#create
@project.route("/create-project", methods="POST")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_project() -> Tuple[Response, int]:
    pass
    
#read
@project.route("/get-projects", methods="GET")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_projects(): 
    pass

#update
@project.route("/edit-project/<int:project_id>", methods="PATCH")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_project(project_id: int) -> Tuple[Response, int]: 
    pass

#delete
@project.route("/delete-project/<int:project_id>", methods="DELETE")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_project(project_id: int) -> Tuple[Response, int]:
    pass



