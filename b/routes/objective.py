#This handles all the objective routes
import os 
from dotenv import load_dotenv
from flask import Blueprint, Response, jsonify, session
from models import User
from plannerPackage import login_required, token_required, filter_dict
from config import db, app, serializer
from typing import Tuple
from datetime import datetime, timezone, timedelta

#create blueprint
objective = Blueprint("objective", __name__)

#import env vars from b/.env
load_dotenv()

#objectives routes 
#create
@objective.route("/create-objective", methods="POST")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def create_objective() -> Tuple[Response, int]:
    pass
    
#read
@objective.route("/get-objectives", methods="GET")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def read_objectives(): 
    pass

#update
@objective.route("/edit-objective/<int:objective_id>", methods="PATCH")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def update_objective(objective_id: int) -> Tuple[Response, int]: 
    pass

#delete
@objective.route("/delete-objective/<int:objective_id>", methods="DELETE")
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_objective(objective_id: int) -> Tuple[Response, int]:
    pass




