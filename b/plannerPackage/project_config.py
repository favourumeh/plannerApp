import os
from azure.keyvault.secrets import SecretClient
from azure.identity import ClientSecretCredential

allowed_origins= [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://plannerappfrontend-daedfdg4fgg6bfgs.uksouth-01.azurewebsites.net/"
    ]

access_token_dur = float(os.environ["accessTokenDurationMins"])
refresh_token_dur =  float(os.environ["refreshTokenDurationDays"])

#vault secrets
    #define azure key vault service principle (client/app) credentials
tenant_id = os.environ["azureTenantId"]
client_id = os.environ["kvClientId"]
client_secret = os.environ["kvClientSecret"]
credential = ClientSecretCredential(tenant_id=tenant_id, client_id=client_id, client_secret=client_secret)

    #draw app secret key from key vault secrets
key_vault_name = "devPlannerAppKV"
secret_name = "plannerAppFlaskSecretKey"
key_vault_uri = f"https://{key_vault_name}.vault.azure.net"
client = SecretClient(vault_url=key_vault_uri, credential=credential)
flask_app_secret_key = client.get_secret(secret_name).value #1
session_key = client.get_secret("sessionEncryptionKey").value #1

#generate a new secret key 
#from uuid import uuid4
# str(uuid4()) or uuid4().hex

#notes:
    #1: see b/.env file for explanation 
