import re
from routes import auth, project, objective, task # import blueprints
from config import app, serializer
from models import db, User, Project, Objective, Refresh_Token, Task
from datetime import datetime
from plannerPackage import login_required, token_required, filter_dict
from flask import jsonify, Response
from typing import Tuple, Dict, List
from werkzeug.test import TestResponse
from datetime import datetime, timezone

#Record test execution time
now: datetime = datetime.now(tz=timezone.utc)
now_str: str = datetime.strftime(now, '%Y-%m-%dT%H:%M')
now_str_long: str = datetime.strftime(now, "%a, %d %b %Y %H:%M:00 GMT")

#configure app for testing #1
app.config["TESTING"] = True # set to true so Exceptions can propagate to the test client (i.e. so we get HTTP status codes other than 500 when something goes wrong with client request)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///:memory:" #use an in-memory database for tests
app.register_blueprint(auth)
app.register_blueprint(project)
app.register_blueprint(objective)
app.register_blueprint(task)

    #add these test routes which will only be used to test the login_required and token_requied decorators
@app.route("/test-login-required", methods=["GET"])
@login_required(serializer=serializer)
def test_login() -> Tuple[Response, int]:
    return jsonify({"message": "Success: login test completed"}), 200

@app.route("/test-token-required", methods=["GET"])
@token_required(app=app, serializer=serializer)
def test_token() -> Tuple[Response, int]:
    return jsonify({"message": "Success: token test completed"}), 200

    #bind db instance to flask app instance
db.init_app(app=app)

#Test dependencies

class plannerAppTestDependecies():
    """This class contains methods that are used in all test modules. These methods standardise the tesing of login and auth for 
    each route that requires login and an access token. It also helps with filtering fields from read response"""

    def client_test_request(self, httpmethod:str, endpoint: str, json_data: dict|None) -> TestResponse:
        """Makes a test request to the API via FlaskClient (self.cleint = app.test_client(use_cookies=True)). 
        Args:
            httpmethod: the http method being used (i.e., get, post, patch, delete)
            endpoint: the endpoint of the route where test request are sent. Must begin with '/'
            json_data: the json body being passed with test request"""
        if httpmethod=="get":
            return self.client.get(endpoint)
        if httpmethod=="post":
            return self.client.post(endpoint, json=json_data)
        if httpmethod=="patch":
            return self.client.patch(endpoint, json=json_data)
        if httpmethod=="delete":
            return self.client.delete(endpoint)
            
    def standard_login_and_auth_test(self, httpmethod:str, endpoint:str, json_data:dict|None, username:str, pwd:str, email:str|None=None) -> None:
        """These test 2 things: 1) Can the user access a protected route without a bespoke_session cookie(bsc)
        2) can the user access a protected route without session_AT cookie(satc). 
        note: In this method a user account is created and the user is login (hence username an password). A user project is also created. 
        Args:
            httpmethod: the http method being used (i.e., get, post, patch, delete)
            endpoint: the (relative) endpoint of the protected route. Must being with "/".
            json_data: the json body of the request. If http method does not need a json body (e.g., get) then set to None. 
            username: username used to sign-up and login user
            pwd: password used to signup and login user
            email: email used in user sign-up"""
        #Test cases 
        print("         Test accessing route without login(no bsc) fails")
        response = self.client_test_request(httpmethod=httpmethod, endpoint=endpoint,json_data=json_data)
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")

        #signup and login #
        print("         Test valid sign up and login")
        rs = self.client.post("/sign-up", json={"username":username, "password1":pwd, "password2":pwd, "email":email})
        rl = self.client.post("/login", json={"username":username, "password":pwd})
        self.assertEqual(rs.status_code, 201)
        self.assertEqual(rl.status_code, 200)
        satc = self.client.get_cookie("session_AT").value #session_AT cookie(satc)

        print("         Test accessing route without login(no satc) fails")
        self.client.set_cookie(key="session_AT", value="", httponly=True, samesite="None", secure=True) #remove satc
        response = self.client_test_request(httpmethod=httpmethod, endpoint=endpoint,json_data=json_data)
        self.assertEqual(response.json["message"], "Request is missing access token. Please login to refresh access token")
        self.client.set_cookie(key="session_AT", value=satc, httponly=True, samesite="None", secure=True) # add satc

    def read_and_filter_fields(self, read_endpoint:str, entity:str, rel_fields:List[str]) -> list[Dict]:
        """Reads all the entities (projects, objectives or tasks) that belong to the logged in user and filters the relevant fields. 
        Args:
            read_endpoint: the endpoint for the entity to make the get request to. Must begin with '/'. 
            entity: the (plural) name of the entity. Used to extract the key of the json response that stores the list entries belonging to the entity. 
            rel_fields: (aka relevant fields) The fields to return from each objective"""
        response = self.client.get(read_endpoint)
        entity_entries: List[Dict] = response.json[entity]
        entity_entires_filtered_fields: List[Dict] = [filter_dict(entry, rel_fields) for entry in entity_entries]
        return entity_entires_filtered_fields

    def read_response_field_filter(self, response:TestResponse, entity:str, rel_fields:List[str]) -> list[Dict]:
        """Filters the relevant entity fields of a read request to a planner app entity (projects, objectives or tasks). 
        Args:
            entity: the (plural) name of the entity. Used to extract the key of the json response that stores the list entries belonging to the entity. 
            rel_fields: (aka relevant fields) The fields to return from each objective"""
        entity_entries: List[Dict] = response.json[entity]
        entity_entires_filtered_fields: List[Dict] = [filter_dict(entry, rel_fields) for entry in entity_entries]
        return entity_entires_filtered_fields
    
        
    
#notes:
#1: most of the apps config is defined in the config.py file with the exception of the SQLALCHEMY_DATABASE_URI. 
    # This is because the test app does not use a local sqlite/mysql db rather it uses a in-memory database