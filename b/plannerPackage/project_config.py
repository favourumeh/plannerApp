import os, sys
from dotenv import load_dotenv
from azure.keyvault.secrets import SecretClient
from azure.identity import ClientSecretCredential
from . import generate_config_dict

load_dotenv(dotenv_path="./.env")

allowed_origins= [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://plannerappfrontend-daedfdg4fgg6bfgs.uksouth-01.azurewebsites.net",
    "https://lively-meadow-088461003.6.azurestaticapps.net",
    "https://planner-frontend.favours-planner.xyz",
    ]

access_token_dur = float(os.environ["accessTokenDurationMins"])
refresh_token_dur =  float(os.environ["refreshTokenDurationDays"])

#generate the config dict
params = sys.argv[1:]
print("sys.argv: ", params)
default_config_dict= {"--env":"prod", "--rdbms":"az_mysql"}
config_dict = generate_config_dict(params, default_config_dict)

#Get vault secrets if in prod env
if config_dict["--env"] != "dev" or config_dict["--rdbms"] == "az_mysql":
    #define azure key vault service principle (client/app) credentials
    tenant_id = os.environ["azureTenantId"]
    client_id = os.environ["kvClientId"]
    client_secret = os.environ["kvClientSecret"]
    credential = ClientSecretCredential(tenant_id=tenant_id, client_id=client_id, client_secret=client_secret)

    #draw app secret key from key vault secrets
    key_vault_name = "devPlannerAppKV"
    key_vault_uri = f"https://{key_vault_name}.vault.azure.net"
    secret_client = SecretClient(vault_url=key_vault_uri, credential=credential)
    flask_app_secret_key = secret_client.get_secret("plannerAppFlaskSecretKey").value #1
    session_key = secret_client.get_secret("sessionEncryptionKey").value #1

#use lcoal secrets if in dev env
if config_dict["--env"] == "dev" and config_dict["--rdbms"] != "az_mysql":
    flask_app_secret_key = os.environ["flaskAppSecretKey"]
    session_key = os.environ["sessionEncryptionKey"]
    secret_client = None #no need for secret client in dev env
    
#generate a new secret key 
#from uuid import uuid4
# str(uuid4()) or uuid4().hex

#gernerate a fernet key (session key)
# from cryptography.fernet import Fernet
# fernet_key = Fernet.generate_key()

#notes:
    #1: see b/.env file for explanation 
