#This file defines helper functions/decorators for the routes
from flask import request, jsonify, Flask, session
from flask_sqlalchemy import SQLAlchemy
import jwt
from itsdangerous import URLSafeTimedSerializer
from models import Refresh_Token
from functools import wraps
from datetime import datetime, timedelta
from . import refresh_token_dur, decrypt_bespoke_session_cookie #alternative: from plannerPackage import refre...
from . import session_key
from werkzeug.security import generate_password_hash, check_password_hash
from pytz import timezone

#create authorisation decorator 
def token_required(app: Flask, serializer: URLSafeTimedSerializer):
    """
    Checks the integrity and validity of the user's AT cookie (session_AT). Used before any user's CRUD requests. 
    Args:
        app: Flask app instance
        serializer: used to deserialize and verify the signature of the access token cookie 'session_AT'.
    """
    def decorated(func):
        @wraps(func)
        def access_token_validation(*args, **kwargs):
            resp_dict = {"message": ""}
            #get access token from http-only cookie
            access_token_cookie: str|None = request.cookies.get("session_AT")

            if not access_token_cookie:
                resp_dict["message"] = "Request is missing access token. Please login to refresh access token"
                return jsonify(resp_dict), 401
            try:
                access_token = serializer.loads(access_token_cookie)
            except Exception as e:
                resp_dict["message"] = f"Deserialisation or Signiture verificaiton of access token cookie has failed! Reason: {e}"
                return jsonify(resp_dict), 401

            #Validate access token
            try:
                payload: dict = jwt.decode(
                    jwt = access_token,
                    key = app.config["SECRET_KEY"],
                    algorithms = "HS256"
                )
            except Exception as e:
                resp_dict["message"] = f"Invalid Access Token! Reason: {e}"
                return jsonify(resp_dict), 401
            return func(*args, **kwargs)
        return access_token_validation
    return decorated

#login (authentication) required decorator
def login_required(serializer: URLSafeTimedSerializer):
    """Checks a user's login status by checking the integrity and validity of the RT cookie ("bespoke_session"). Used for each CRUD request and logout request"""
    def decorated(func):
        @wraps(func)
        def refresh_token_validation(*args, **kwargs):
            resp_dict = {"message": ""}
            cookie = request.cookies.get("bespoke_session")
            
            if not cookie:
                resp_dict["message"] = "Failure: User is not logged in (no b_sc). Please login!"
                return jsonify(resp_dict), 401

            #Decrypt bespoke session cookie
            try:
                decrypted_session_data = decrypt_bespoke_session_cookie(cookie=cookie, serializer=serializer, decryption_key=session_key)
            except Exception as e:
                resp_dict["message"] = f"Failure: Could not decrypt the bespoke_session cookies. Reason: {e}"
                return jsonify(resp_dict), 401
    
            #Extract user id,username and refreshToken  from the session data and store it in session object for use in downstream function
            session["userId"] = decrypted_session_data["userId"]
            session["username"] = decrypted_session_data["username"]
            session["refreshToken"] = decrypted_session_data["refreshToken"]
            
            #Check if the user has a refresh_token. If they don't then they are not logged in
            refresh_token_obj: Refresh_Token = Refresh_Token.query.filter_by(user_id=session["userId"]).first()
            if not refresh_token_obj:
                resp_dict["message"] = "Failure: User is not logged in (no rt). Please login!"
                return jsonify(resp_dict) , 404
            
            #Check if the user is using an invalid refresh token in the cookies
            if not check_password_hash(refresh_token_obj.token, session["refreshToken"]):
                resp_dict["message"] = "Failure: Refresh token is invalid. Please login"
                return jsonify(resp_dict), 401
            
            #check if user's token has expired
            now: datetime = datetime.now(tz=timezone('Europe/London'))
            refresh_token_exp: datetime = refresh_token_obj.exp.astimezone(timezone('Europe/London'))
            # print("now: ", now)
            # print("refresh_token_exp: ", refresh_token_exp)
            if  refresh_token_exp < now:
                resp_dict["message"] = "Failure: Please login. Refresh token has expired."
                return jsonify(resp_dict), 401
                
            return func(*args, **kwargs)
        return refresh_token_validation
    return decorated


# updated refresh token db
def update_refresh_token_table(action: str, refresh_token_obj: Refresh_Token|None, db: SQLAlchemy, token_UUID: str, user_id: int) -> Refresh_Token:
    """Adds to/Updates the entries of the Refresh_Token table. Note: each user gets ONE refresh token. 
    Args:
        action: 'create' adds an entry to the Refresh_Token db table for a specified user (user_id). 'update' updates the exp and refresh token hash for a specific user.
        refresh_token_obj: an instance of models.Refresh_Token class. Derived from first result of a query of Refresh_Token which searched for the refrehs token of a user via userId.  
        db: the SQLAlchemy database intance for the app.
        token_UUID: the refresh token (uuid4). 
        user_id: user id of user whose refresh token is being created/updated
    """
    exp = datetime.now(tz=timezone('Europe/London')) + timedelta(days = refresh_token_dur)
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