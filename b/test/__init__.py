from routes import auth, project
from config import app, serializer
from models import db, User, Project, Refresh_Token
from datetime import datetime

#configure app
app.config["TESTING"] = True # set to true so Exceptions can propagate to the test client (i.e. so we get HTTP status codes other than 500 when something goes wrong with client request)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///:memory:" #use an in-memory database for tests
app.register_blueprint(auth)
app.register_blueprint(project)

#bind db instance to flask app instance
db.init_app(app=app)