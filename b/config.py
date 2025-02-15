import os, sys
from dotenv import load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import project_config
from models import db
import plannerPackage as pp
from itsdangerous import URLSafeTimedSerializer

#cwd
cwd = os.getcwd().replace("\\", "/")

#load env vars from b/.env
load_dotenv()

#draw secrets from key vault secret
flask_app_secret_key = os.environ["flask_app_secret_key"]

#Create Flask app instance
app = Flask(__name__)
CORS(app, 
     resources={"r/*":{"origins":project_config.allowed_origins}},
     methods=["GET","POST","PATCH", "DELETE"],
     supports_credentials=True
)

#configure app secret key
app.config["SECRET_KEY"] = flask_app_secret_key
    #create serialiser object which wraps a signer (secret key) to enable serialising and securely signing data
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

#generate the config dict
params = sys.argv[1:]
print("sys.argv: ", params)
default_config_dict= {"--env":"dev", "--rdbms":"sqlite"}
config_dict = pp.generate_config_dict(params, default_config_dict)

#bind the database instance to flask app instance 
db.init_app(app=app)

#configure databse sqlite or az_mysql
db_name = "planner_app_db"
if config_dict["--rdbms": "sqlite"]:
    app.config["SQLALCHEMY_DATABASE_URI"]= f"sqlite:///{cwd}/{db_name}.db"

app.config["SQLACHEMY_TACK_MODIFICATIONS"] = False
