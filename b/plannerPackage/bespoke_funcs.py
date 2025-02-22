from typing import List, Dict
from cryptography.fernet import Fernet
import os
import json
from itsdangerous import URLSafeTimedSerializer
from dotenv import load_dotenv

load_dotenv()


def generate_config_dict(params: List[str], default_config_dict: Dict[str, str]) -> Dict[str, str]:
    """
    Creates a dictornary that stores the current backend environemnt and the relationship databse management system(rdbms) used
    by the flask app. 
    Args:
        params: the list of cmd line args passed to the python app script b/main.py (sys.argv[1:])
        default_config_dict: something like {"--env":"prod", "--rdbms":"az_mysql"}
    """
    config_params = ["--env","--rdbms"]
    bool_list = [config_param in params for config_param in config_params]
    if all(bool_list):
        keys = config_params
        values = [params[params.index(key)+1] for key in keys]
        config_dict = dict(zip(keys, values))
        print("config_dict:", config_dict)
    else:
        config_dict =  default_config_dict
        print("config_dict:", config_dict)
    
    return config_dict

def filter_dict(dict_obj: Dict[str, str], keys: List[str]) -> Dict:
    """Filters a dictionary by the keys provided
    Args:
        dict_obj: the dictionary being filtered
        keys: the keys to keep from the dict"""
    return dict(filter(lambda i: i[0] in keys, dict_obj.items()))


def decrypt_bespoke_session_cookie(cookie: str, serializer: URLSafeTimedSerializer, decryption_key: str) -> Dict:
    """Converts the 'bespoke session' cookie string to its original python dictionary which contains: logged_in, userID, username and refreshToken
    It involves the desrialisation of the cookie, the decrption of the cookie
    Args:
        cookie: 'bespoke_session' cookie
        serializer: the serializer that signs and serialised the cookie so it can be use in request URLs
        decryption_key: used to decrypt the deserialised byte string of the bespose_session cookies"""
    # bespoke_session contains {"logged_in":, "username":, "user_id":, "refreshToken": }. 
    encrypted_session_data: bytes = serializer.loads(cookie) 
    cipher = Fernet(decryption_key.encode())
    decrypted_session_data: dict = json.loads(cipher.decrypt(encrypted_session_data).decode())
    return decrypted_session_data