#This file defines helper functions/decorators for the routes
from flask import request, jsonify, Flask, session
from flask_sqlalchemy import SQLAlchemy
import jwt
from itsdangerous import URLSafeTimedSerializer
from models import Refresh_Token
from functools import wraps
from datetime import datetime, timedelta, timezone
from . import refresh_token_dur #alternative: from plannerPackage import refre...
from uuid import uuid4
from werkzeug.security import generate_password_hash
from cryptography.fernet import Fernet
import json
import os
from dotenv import load_dotenv

#import env vars from b/.env file
load_dotenv()

#create authorisation decorator 
def token_required(app: Flask, serializer: URLSafeTimedSerializer):
    """
    Checks the user's CRUD requests to determine if: 1) There is a cookie containing the access token called 'session_AT';
    2) The token is valid. 
    Args:
        app: Flask app instance
        serializer: used to deserialize and verify the signature of the access token cookie 'session_AT'.
    """
    def decorated(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            resp_dict = {"message": ""}
            #get access token from http-only cookie
            access_token_cookie: str|None = request.cookies.get("session_AT")

            if not access_token_cookie:
                resp_dict["message"] = "Request is missing access token. Please login to refresh access token"
                return jsonify(resp_dict), 400
            try:
                access_token = serializer.loads(access_token_cookie)
            except Exception as e:
                resp_dict["message"] = f"Deserialisation or Signiture verificaiton of access token cookie has failed. Err Message: {e}"
                return jsonify(resp_dict), 400

            #Validate access token
            try:
                payload = jwt.decode(
                    jwt = access_token,
                    key = app.config["SECRET_KEY"],
                    algorithms = "HS256"
                )
            except Exception as e:
                resp_dict["message"] = f"Invalid Access Token! Reason: {e}"
                return jsonify(resp_dict), 401
            return func(*args, **kwargs)
        return wrapper
    return decorated

#login (authentication) required decorator
def login_required(serializer: URLSafeTimedSerializer):
    """Checks a user's login status. Used for each CRUD request and logout request"""
    def decorated(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            resp_dict = {"message": ""}
            cookie = request.cookies.get("bespoke_session")
            
            if not cookie:
                resp_dict["message"] = "Currently logged out. Please login"
                return jsonify(resp_dict), 400
            encrypted_session_data: str = serializer.loads(cookie) 
            cipher = Fernet(os.environ["session_key"].encode())
            decrypted_session_data: dict = json.loads(cipher.decrypt(encrypted_session_data.encode()).decode())
            logged_in = decrypted_session_data["logged_in"]
            
            if logged_in != "True":
                resp_dict["message"] = "Please login!"
                return jsonify(resp_dict), 401
            
            #Extract user id from the session data for use in downstream function
            session["userID"] = decrypted_session_data["userID"]
            return func(*args, **kwargs)
        return wrapper
    return decorated


# updated refresh token db
def update_refresh_token_table(action: str, refresh_token_obj: Refresh_Token|None, db: SQLAlchemy, token_UUID: str, user_id: int) -> Refresh_Token:
    """Adds to/Updates the entries of the Refresh_Token table. Note: each user gets ONE refresh token. 
    Args:
        action: 'create' adds an entry to the Refresh_Token db table for a specified user (user_id). 'update' updates the exp and refresh token hash for a specific user.
        refresh_token_obj: an instance of models.Refresh_Token class. Derived from first result of a query of Refresh_Token which searched for the refrehs token of a user via userID.  
        db: the SQLAlchemy database intance for the app.
        token_UUID: the refresh token (uuid4). 
        user_id: user id of user whose refresh token is being created/updated
    """
    exp = datetime.now(tz = timezone.utc) + timedelta(days = refresh_token_dur)
    token_hash = generate_password_hash(token_UUID)

    if action == "create":
        refresh_token_obj = Refresh_Token(token=token_hash, exp=exp, user_id=user_id)  
        db.session.add(refresh_token_obj)
        db.session.commit()
        return refresh_token_obj

    if action == "update":
        refresh_token_obj.exp = exp
        refresh_token_obj.token = token_hash
        db.session.commit()
        return refresh_token_obj