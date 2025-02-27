from routes import auth, project, objective, task # import blueprints
from config import app, serializer
from models import db, User, Project, Objective, Refresh_Token
from datetime import datetime
from plannerPackage import login_required, token_required
from flask import jsonify, Response
from typing import Tuple

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

#notes:
#1: most of the apps config is defined in the config.py file with the exception of the SQLALCHEMY_DATABASE_URI. 
    # This is because the test app does not use a local sqlite/mysql db rather it uses a in-memory database