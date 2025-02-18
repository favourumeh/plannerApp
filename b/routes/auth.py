import os
from dotenv import load_dotenv
import json
from config import db, app, serializer
from flask import Blueprint, request, jsonify, Response, session
from models import User, Refresh_Token
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Tuple
import jwt
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from plannerPackage import login_required, token_required, update_refresh_token_table, access_token_dur
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
    username = creds["username"]
    email = creds.get("email", None)
    password1 = creds["password1"]
    password2 = creds["password2"]
    
    #Validate Client Input
    user = User.query.filter_by(username = username).first()
    if user:
        resp_dict["message"] = "Failure: Username is taken. Please choose another one."
        return jsonify(resp_dict), 400
    if len(username) > 15:
        resp_dict["message"] = "Failure: Username is too long. Must be <= 15 characters."
        return jsonify(resp_dict), 400
    if email:
        user_e = User.query.filter_by(email=email).first()
        if user_e:
            resp_dict["message"] = "Failure: Email is taken. Please choose another one."
            return jsonify(resp_dict), 400
        if len(email) > 120:
            resp_dict["message"] = "Failure: Email is too long. Must be <= 120 characters. "
            return jsonify(resp_dict), 400
    if password1 != password2:
        resp_dict["message"] = "Failure: Passwords do not match"
        return jsonify(resp_dict), 400
    
    try:
        #Successfull Client Input
        password_hash = generate_password_hash(password=password1, method="pbkdf2")
        user = User(username=username, email=email, password=password_hash)
        db.session.add(user)
        db.session.commit()
        resp_dict["message"] = f"Success: Account Created! Login to start planning"
        return jsonify(resp_dict), 201
    except Exception as e:
        resp_dict["message"] = f"Failure: Account Sign-up failed. Reason {e}"
        return jsonify(resp_dict), 404

@auth.route("/login", methods = ["POST"])
def login():
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
        print(check_password_hash(password, user.password))
        print("password", password)
        print("password_hash", user.password)
        print("user", user.username)
        resp_dict["message"] = "Failure: Incorrect password"
        return jsonify(resp_dict), 401
    
    #create session dict (soon to be http-only cookie)
    session_data: dict = {"logged_in": "True",
                          "username": user.username,
                          "userID": user.id}

    token_UUID = str(uuid4)
    session_data["refresh_token"] = token_UUID

    #create/updated refresh token
    refresh_token_obj = Refresh_Token.query.filter_by(user_id=user.id).first()

    if refresh_token_obj:
        token_expired =  refresh_token_obj.exp.replace(tzinfo=timezone.utc) < datetime.now(tz = timezone.utc)
        if token_expired:
            try:
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
    resp_dict["message"] = f"Success: Login Successfull. Welcome {user.username}"
    resp = jsonify(resp_dict)

    #create JWT(access token)
    now: datetime = datetime.now(tz=timezone.utc)
    access_token = jwt.encode(
        payload = {"sub": "access token", # identifies the subject of the jwt
                   "iat":  int(now.timestamp()), #time jwt was issued (as timestamp integer). To convert back to datetime.datetime:  datetime.fromtimestamp(<timestamp>, tz=timezone.utc)
                   "exp": now + timedelta(minutes=access_token_dur), #token expiration date
                   "userID": user.id,
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
def logout():
    resp = jsonify({"message": "Logout Successfull"})    
    #clear bespoke_session cookie
    resp.set_cookie(key="bespoke_session", value="", httponly=True, samesite="None", secure=True)
    resp.set_cookie(key="session_AT", value="", httponly=True, samesite="None", secure=True)
    return resp, 200

#refresh route
@auth.route("/refresh", methods = ["GET"])
@login_required(serializer=serializer)
def refresh() -> Tuple[Response, int]:
    "refreshes the access token"
    resp_dict = {"message":""}
    #decrypt bespoke cookies
    try:
        # bespoke_session contains {"logged_in":, "username":, "user_id":, "refresh_token": }. 
        encrypted_session_data: bytes = serializer.loads(request.cookies.get("bespoke_session")) 
        cipher = Fernet(os.environ["session_key"].encode())
        session_data: dict = json.loads(cipher.decrypt(encrypted_session_data).decode())
    except Exception as e:
        resp_dict["message"] = f"Could not decode the bespoke cookies. Reason: {e}"
        return jsonify(resp_dict), 400

    #Use userID from bespoke cookies dict to extract user entry
    user_id: int = session_data["userID"] 
    user: User = User.query.filter(User.id == user_id).first()
        
    refresh_token_obj: Refresh_Token = Refresh_Token.query.filter(Refresh_Token.user_id == user_id).first() #refresh token from db
    refresh_token: str = session_data["refresh_token"] #refesh token (uuid4) from client's http-only cookies
    
    #check if refresh token entry exist in Refresh_Token table
    if not refresh_token_obj:
        resp_dict["message"] = "The user does not have a refresh token in the db. Please login to generate one"
        return jsonify(resp_dict), 404
    
    #check if refresh token has expired 
    if refresh_token_obj.exp.replace(tzinfo = timezone.utc) < datetime.now(tz=timezone.utc):
        resp_dict["message"] = "Please login. Refresh token has expired."
        return jsonify(resp_dict), 401

    #check if refresh token is invalid
    if check_password_hash(refresh_token_obj.token, refresh_token):
        resp_dict["message"]  = "Please Login. Refresh token is invalid."
    
    #generate access token (JWT)
    now: datetime = datetime.now(tz=timezone.utc)
    access_token = jwt.encode(
        payload = {"sub": "access token", # identifies the subject of the jwt
                   "iat": int(now.timestamp()), #time jwt was issued as a timestamp integer
                   "exp": now + timedelta(minutes=access_token_dur), #token expiration date
                   "userID": user.id,
                   "username": user.username},
        key = app.config["SECRET_KEY"],
        algorithm = "HS256"
    )
    resp_dict["message"] = "Successfully refreshed access_token"
    resp: Response = jsonify(resp_dict)

    #Add http-only cookie containing access token to server response
    serialized_access_token: str = serializer.dumps(access_token)
    resp.set_cookie(key="session_AT", value=serialized_access_token, httponly=True, samesite="None", secure=True)
    print("serialized access token",serialized_access_token)
    return resp, 200


@auth.route("/delete/<int:user_id>", methods = ["DELETE"])
@token_required(app=app, serializer=serializer)
@login_required(serializer=serializer)
def delete_user(user_id: int):
    resp_dict = {"message": "boo", "userID": f"{session["userID"]}"}

    if user_id != session["userID"]:
        resp_dict["message"] = "Failure: Account chosen for deletion does not match the account logged in."
        return jsonify(resp_dict), 401
    
    user: User = User.query.filter_by(id=session["userID"]).first()
    refresh_token_obj: Refresh_Token = Refresh_Token.query.filter_by(user_id=session["userID"]).first()
    
    if not user:
        resp_dict["message"] = "The account you are attempting to delete does not exist"
        return jsonify(resp_dict), 404

    try:
        db.session.delete(user)
        db.session.delete(refresh_token_obj)
        db.session.commit()
        resp_dict["message"] = f"Deleted account ({user.username}) associated refresh token."
        return jsonify(resp_dict), 200
    except Exception as e:
        resp_dict["message"] = f"Could not delete the chosen user. Reason {e}"
        return jsonify(resp_dict), 404

