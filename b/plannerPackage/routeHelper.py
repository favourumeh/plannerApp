#This file defines helper functions/decorators for the routes
from flask import request, jsonify, Flask
from flask_sqlalchemy import SQLAlchemy
import jwt
from itsdangerous import URLSafeTimedSerializer
from models import Refresh_Token
from functools import wraps
from datetime import datetime, timedelta, timezone
from plannerPackage import refresh_token_dur
from uuid import uuid4
from werkzeug.security import generate_password_hash
from cryptography.fernet import Fernet
import json
import os
from dotenv import load_dotenv

#import env vars from b/.env file
load_dotenv()

#create authorisation decorator 
def token_required(app: Flask):
    """
    Checks the user's CRUD requests to determine if: 1) There is an 'Authorization' header; 2) If an access token is present; 3) if the token is valid.
    """
    def decorated(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            resp_dict = {"message": "", "err":""}
            
            #Check if request contains "Authorization" header
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                resp_dict["message"] = "Request is missing 'Authorization' header."
                return jsonify(resp_dict), 400
            
            #Extract access token (Bearer) from "Authorization" header
            token = auth_header.split(" ")[-1] if auth_header.startswith("Bearer ") else ""
            if not token:
                resp_dict["message"] = "Access Token missing! Please authenticate (login or refresh) to generate access token"
                return jsonify(resp_dict), 401
            
            #Validate access token
            try:
                payload = jwt.decode(
                    jwt = token,
                    key = app.config["SECRET_KEY"],
                    algorithms = "HS256"
                )
            except Exception as e:
                resp_dict["message"], resp_dict["err"] = "Invalid Access Token!", f"{e}"
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
            encrypted_session_data: bytes = serializer.loads(request.cookies.get("bespoke_session")) 
            cipher = Fernet(os.environ["session_key"].encode())
            decryoted_session_data: dict = json.loads(cipher.decrypt(encrypted_session_data).decode())
            logged_in = decryoted_session_data["logged_in"]

            if logged_in != "True":
                resp_dict["message"] = "Please login!"
                return jsonify(resp_dict), 401
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
        db.session.commit(refresh_token_obj)
        return refresh_token_obj

    if action == "update":
        refresh_token_obj.exp = exp
        refresh_token_obj.token = token_hash
        db.session.commit()
        return refresh_token_obj