import os, sys
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
from models import db
import plannerPackage as pp
from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
import warnings

#cwd
cwd = os.getcwd().replace("\\", "/")

#load env vars from b/.env and .env
load_dotenv(dotenv_path="./.env")
load_dotenv(dotenv_path="../.env")

#Create Flask app instance
app = Flask(__name__)
CORS(app, 
    resources={r"/*":{"origins":pp.allowed_origins}},
    methods=["GET","POST","PATCH", "DELETE"],
    supports_credentials=True,
)

#create API docs blueprint
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Planner App",
    }
)

app.register_blueprint(swaggerui_blueprint)

#configure app secret key
app.config["SECRET_KEY"] = pp.flask_app_secret_key
    #create serialiser object which wraps a signer (secret key) to enable serialising and securely signing data
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

#configure databse sqlite or az_mysql
db_name = "planner_app_db"

if 'test' not in ",".join(sys.argv): #1
    
    #messages below stop dev from accidentally writing to the prod db during testing.
    if (pp.config_dict["--env"] == "dev" and pp.config_dict["--rdbms"] == "az_mysql"): #underlined red error message (;4)
        raise Exception("\033[31;1;4mFlask App Input Error: You cannot have the configuraion: --env:dev and --rdbms: az_mysql\033[0m")

    if ( pp.config_dict["--rdbms"] == "az_mysql"): # yellow warning message (;4)
        warnings.warn("\033[93;1;4mWARNING: Your app is connected to the prod db!!! Please ensure that this is what you want.\033[0m")
    
    if pp.config_dict["--rdbms"] == "sqlite":
        app.config["SQLALCHEMY_DATABASE_URI"]= f"sqlite:///{cwd}/{db_name}.db"

    if pp.config_dict["--rdbms"] == "mysql":
        app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{os.environ["mySQLUser"]}:{os.environ["mySQLPassword"]}@{os.environ["mySQLHost"]}/{db_name}"

    if pp.config_dict["--rdbms"] == "az_mysql":
        #download SSL Certificate from blob storage
        connect_str = pp.secret_client.get_secret(name = "PLANNER-APP-AZURE-STORAGE-CONNECTION-STRING").value
        ssl_cert_filename = os.environ["ssl_cert_filename"]

        blob_service_client = BlobServiceClient.from_connection_string(connect_str)
        blob_client = blob_service_client.get_blob_client(container = os.environ["blob_container_name"], blob=ssl_cert_filename)

        ssl_cert_dir = "/tmp/SSL Certificate"
        ssl_cert_path = f"{ssl_cert_dir}/{ssl_cert_filename}" 
        os.makedirs(ssl_cert_dir) if not os.path.exists(ssl_cert_dir) else None

        with open(file=ssl_cert_path, mode="wb") as download_file:
            print(f"Downloading the SSL cert to dir '{ssl_cert_dir}/'. ")
            download_stream = blob_client.download_blob()
            download_file.write(download_stream.readall())
            print(f"Download Successfull. SSL Cert at {ssl_cert_path}. To view use Ubuntu terminal and cd to the path.")

        #mysql db creds
        db_user = pp.secret_client.get_secret(name="mySQLUsername").value
        db_password = pp.secret_client.get_secret(name="mySQLPassword").value
        db_host = pp.secret_client.get_secret(name="mySQLServerName").value
        app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}?ssl_ca={ssl_cert_path}"


    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    #enable concurrent request to the database
    app.config['SQLALCHEMY_POOL_SIZE'] = 3          # Max connections per worker
    app.config['SQLALCHEMY_MAX_OVERFLOW'] = 1       # Extra connections if pool is full
    app.config['SQLALCHEMY_POOL_RECYCLE'] = 300     # Recycle connections after 1h
    app.config['SQLALCHEMY_POOL_PRE_PING'] = True    # Test connections before reuse    
    
    #bind the database instance to flask app instance 
    db.init_app(app=app)

#notes: 
    #1: Don't want configure the sqlalchemy database OR bind databse instance to flask instance if we are running test scripts as this points test client app to the local sqlite database which is NOT the intent of testing. 
        #In testing the goal is to create an in-memory sqlite database and test the API's routes against that NOT the local sqlite database (or any other db). Hence the sqlalchemy database uri is defined in the test scripts. 