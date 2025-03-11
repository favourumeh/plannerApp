import os
import re
from dotenv import load_dotenv
import json
from config import db, app, serializer
from flask import Blueprint, request, jsonify, Response, session
from models import User, Refresh_Token, Project
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Tuple
import jwt
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from plannerPackage import login_required, token_required, update_refresh_token_table, access_token_dur, filter_dict
from cryptography.fernet import Fernet

#import env vars from b/.env file
load_dotenv()

#create blueprint
auth = Blueprint("auth", __name__)

#Generate session data encoder
@auth.route("/sign-up", methods =["POST"])
def signup() -> Tuple[Response, int]:
    """Creates a user entry into the User Table"""
    resp_dict = {"message":""}
    creds = request.json
    username = creds.get("username", None)
    email = creds.get("email", None)
    password1 = creds.get("password1", None)
    password2 = creds.get("password2", None)

    #Validate Client Input
    if not username:
        resp_dict["message"] = "Failure: Username is missing!"
        return jsonify(resp_dict), 400

    user = User.query.filter_by(username = username).first()
    if user:
        resp_dict["message"] = "Failure: Username is taken. Please choose another one."
        return jsonify(resp_dict), 400
    if len(username) > 15:
        resp_dict["message"] = "Failure: Username is too long. Must be <= 15 characters."
        return jsonify(resp_dict), 400

    #account for blank email fields
    email = None if email=="" else email

    if email:
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if  not re.match(email_regex, email):
            resp_dict["message"] = "Failure: Email is not valid"
            return jsonify(resp_dict), 400

        user_e = User.query.filter_by(email=email).first()
        if user_e:
            resp_dict["message"] = "Failure: Email is taken. Please choose another one."
            return jsonify(resp_dict), 400
        if len(email) > 120:
            resp_dict["message"] = "Failure: Email is too long. Must be <= 120 characters."
            return jsonify(resp_dict), 400
    if password1 != password2:
        resp_dict["message"] = "Failure: Passwords do not match"
        return jsonify(resp_dict), 400
    
    try:
        #Successfull Client Input
        password_hash = generate_password_hash(password=password1, method="pbkdf2")
        user = User(username=username, email=email, password=password_hash)
        db.session.add(user)
        user_id = User.query.filter_by(username=username).first().id
        default_project = Project(type="default project", title="Default", description="Refrences all non-user created objectives and tasks", tag="default", user_id=user_id)
        db.session.add(default_project)
        db.session.commit()
        resp_dict["message"] = f"Success: Account Created! Login to start planning"
        return jsonify(resp_dict), 201
    except Exception as e:
        resp_dict["message"] = f"Failure: Account Sign-up failed. Reason {e}"
        return jsonify(resp_dict), 404

@auth.route("/login", methods = ["POST"])
def login() -> Tuple[Response, int]:
    resp_dict = {"message":"", "user": ""}
    creds = request.json
    username, password = creds.get("username", ""), creds.get("password", "")
    user: User = User.query.filter_by(username=username).first()

    #check if username is valid
    if not user:
        resp_dict["message"] = "Failure: User not found"
        return jsonify(resp_dict), 401
    #check if password is valid
    if not check_password_hash(user.password, password):
        resp_dict["message"] = "Failure: Incorrect password"
        return jsonify(resp_dict), 401
    
    #create session dict (soon to be http-only cookie)
    session_data: dict = {"logged_in": "True",
                          "username": user.username,
                          "userId": user.id}

    token_UUID = str(uuid4())
    session_data["refreshToken"] = token_UUID

    #create/updated refresh token
    refresh_token_obj = Refresh_Token.query.filter_by(user_id=user.id).first()

    if refresh_token_obj:
        try: #regardless of whether the refresh token in expired or not, it should be updated on login
            refresh_token_obj = update_refresh_token_table(action="update", refresh_token_obj=refresh_token_obj, db=db, token_UUID=token_UUID, user_id=user.id)
        except Exception as e:
            resp_dict["message"] = f"Failure: Could not update the user's refresh token entry. Reason: {e}"
            return jsonify(resp_dict), 404
    else:
        try:
            refresh_token_obj = update_refresh_token_table(action="create", refresh_token_obj=refresh_token_obj, db=db, token_UUID=token_UUID, user_id=user.id)
        except Exception as e:
            resp_dict["message"] = f"Failure: Could not create a refresh token entry for the user. Reason: {e}"
            return jsonify(resp_dict), 404

    #successfull login 
    user_dict = user.to_dict()
    resp_dict["message"] = f"Success: Login Successfull. Welcome {user.username}"
    resp_dict["user"] = filter_dict(user_dict, ["id","username"]) #dict(filter(lambda i: i[0] in ["username", "id"] , user_dict.items()))
    
    resp = jsonify(resp_dict)

    #create JWT(access token)
    now: datetime = datetime.now(tz=timezone.utc)
    access_token = jwt.encode(
        payload = {"sub": "access token", # identifies the subject of the jwt
                   "iat":  int(now.timestamp()), #time jwt was issued (as timestamp integer). To convert back to datetime.datetime:  datetime.fromtimestamp(<timestamp>, tz=timezone.utc)
                   "exp": now + timedelta(minutes=access_token_dur), #token expiration date
                   "userId": user.id,
                   "username": user.username},
        key = app.config["SECRET_KEY"],
        algorithm = "HS256"
    )
    #resp_dict["accessToken"] = access_token
    serialized_access_token: str = serializer.dumps(access_token)
    resp.set_cookie(key="session_AT", value=serialized_access_token, httponly=True, samesite="None", secure=True)

    #encode session data dict and set it as an http-only cookie
    session_data_json: str = json.dumps(session_data) # json.dumps serializes dict to json fromatted string
    cipher = Fernet(os.environ["session_key"].encode())
    encrypted_session_data: bytes = cipher.encrypt(session_data_json.encode())
    serialized_session_data: str = serializer.dumps(encrypted_session_data.decode())
    resp.set_cookie(key="bespoke_session", value=serialized_session_data, httponly=True, samesite="None", secure=True)

    return resp, 200

@auth.route("/logout", methods=["GET"])
@login_required(serializer=serializer)
def logout() -> Tuple[Response, int]:
    resp_dict = {"message": ""}
    #delete refresh token
    try:
        refresh_token_obj: Refresh_Token = Refresh_Token.query.filter_by(user_id = session["userId"]).first()
        db.session.delete(refresh_token_obj)
        db.session.commit()
        resp_dict["message"] = "Success: Logout completed"
        resp =  jsonify(resp_dict)
        #clear bespoke_session cookie
        resp.set_cookie(key="bespoke_session", value="", httponly=True, samesite="None", secure=True)
        resp.set_cookie(key="session_AT", value="", httponly=True, samesite="None", secure=True)
        return resp, 200
    except Exception as e:
        resp_dict["message"] = f"Could not logout due to db issues. Reason: {e}."
        return jsonify(resp_dict), 400
        

#refresh route
@auth.route("/refresh", methods = ["GET"])
@login_required(serializer=serializer)
def refresh() -> Tuple[Response, int]:
    "refreshes the access token"
    resp_dict = {"message":""}
    
    #Use userID from bespoke cookies dict to extract user entry
    user_id: int = session["userId"] 
    user: User = User.query.filter(User.id == user_id).first()

    #generate access token (JWT)
    now: datetime = datetime.now(tz=timezone.utc)
    access_token = jwt.encode(
        payload = {"sub": "access token", # identifies the subject of the jwt
                   "iat": int(now.timestamp()), #time jwt was issued as a timestamp integer
                   "exp": now + timedelta(minutes=access_token_dur), #token expiration date
                   "userId": user.id,
                   "username": user.username},
        key = app.config["SECRET_KEY"],
        algorithm = "HS256"
    )
    resp_dict["message"] = "Successfully refreshed access_token"
    resp: Response = jsonify(resp_dict)

    #Add http-only cookie containing access token to server response
    serialized_access_token: str = serializer.dumps(access_token)
    resp.set_cookie(key="session_AT", value=serialized_access_token, httponly=True, samesite="None", secure=True)
    return resp, 200


@auth.route("/delete_user/<int:user_id>", methods = ["DELETE"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def delete_user(user_id: int) -> Tuple[Response, int]:
    resp_dict = {"message": "boo", "userId": f"{session["userId"]}"}

    if user_id != session["userId"]:
        resp_dict["message"] = "Failure: Account chosen for deletion does not match the account logged in."
        return jsonify(resp_dict), 403
    
    user: User = User.query.filter_by(id=session["userId"]).first()
    refresh_token_obj: Refresh_Token = Refresh_Token.query.filter_by(user_id=session["userId"]).first()

    try:
        db.session.delete(user)
        db.session.delete(refresh_token_obj)
        db.session.commit()
        resp_dict["message"] = f"Deleted account ({user.username}) and associated access and refresh token."
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Could not delete the chosen user. Reason {e}"
        return jsonify(resp_dict), 404

@auth.route("/edit_user/<int:user_id>", methods = ["PATCH"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def edit_user(user_id: int) -> Tuple[Response, int]:
    resp_dict = {"message":""}

    if user_id != session["userId"]:
        resp_dict["message"] = "Failure: The account you are attempting to edit does not match the account that is logged in"
        return jsonify(resp_dict), 403

    user: User = User.query.filter_by(id=user_id).first()
    creds: dict = request.json
    username: str = creds.get("username", user.username)
    current_password: str|None = creds.get("password", None)
    password1: str = creds.get("password1", user.password)
    password2: str = creds.get("password2", user.password)
    email: str = creds.get("email", user.email)
    last_updated: datetime =  datetime.now(tz=timezone.utc)
    
    if not current_password:
        resp_dict["message"] = "Failure: Please enter your current password"
        return jsonify(resp_dict), 401
        
    if password1 != password2:
        resp_dict["message"] = "Failure: Passwords do not match"
        return jsonify(resp_dict), 400

    #update the user_object's username and password classs variables 
    user.username = username
    user.email = email
    user.last_updated = last_updated
    if creds.get("password1", None):
        user.password = generate_password_hash(password1, method = "pbkdf2")

    try:
        db.session.commit()
        resp_dict["message"] = "Success: User was successfully edited"
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Failure: User changes could not be committed to db. Reason: {e}"
        return jsonify(resp_dict), 404
        

@auth.route("/get-user/<int:user_id>", methods = ["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def get_user(user_id: int) -> Tuple[Response, int]:
    """Allows the admin to gets all fields in of a User's account"""
    resp_dict = {"message":"", "user": ""}

    admin_user: User = User.query.filter_by(id=session["userId"]).first()    
    if not admin_user.is_admin:
        resp_dict["message"] = "Failure: User is not permitted to access this route"
        return jsonify(resp_dict), 403
    
    user_queried: User = User.query.filter_by(id=user_id).first()
    if not user_queried:
        resp_dict["message"] = "Failure: the user you are trying to get does not exist"
        return jsonify(resp_dict), 404
    
    resp_dict["message"] = "Success: retrieved user data"
    resp_dict["user"] = user_queried.to_dict()
    return jsonify(resp_dict), 200

@auth.route("/get-user-rts/<int:user_id>", methods = ["GET"])
@login_required(serializer=serializer)
@token_required(app=app, serializer=serializer)
def get_user_refresh_token(user_id: int) -> Tuple[Response, int]:
    """Allows the admin to gets all fields in of a User's refresh token entry/entries"""
    resp_dict = {"message":"", "user": ""}

    admin_user: User = User.query.filter_by(id=session["userId"]).first()    
    if not admin_user.is_admin:
        resp_dict["message"] = "Failure: User is not permitted to access this route"
        return jsonify(resp_dict), 403

    user_queried: User = User.query.filter_by(id=user_id).first()
    if not user_queried:
        resp_dict["message"] = "Failure: the user you are trying to get does not exist"
        return jsonify(resp_dict), 404
    
    resp_dict["message"] = "Success: retrieved user rt"
    user_rts: Refresh_Token = Refresh_Token.query.filter_by(user_id=user_id).all()
    rts = [{f"{rt.id}":rt.to_dict()} for rt in user_rts] 
    resp_dict["refresh_tokens"] = rts  #user_queried.to_dict()
    return jsonify(resp_dict), 200