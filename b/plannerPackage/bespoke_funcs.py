from typing import List, Dict
from cryptography.fernet import Fernet
from models import Objective
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

def flatten_2d_list(L: List) -> List:
    """Takes a 2d list (L) and makes it 1d. E.g [[1,2], [3,4], ...] => [1,2...]"""
    return [i for j in L for i in j]

def generate_objective_number(objective_number: int|None, project_id:int, Objective: Objective):
    """Generates an 'objective_number' (an objective identifier that is specific to a project). Unlike objective_id
    an objective_number does not have to be unique in the database rather it should be unique to a specific project. 
    Args:
        objective_number: the objective number for the project. Can be changed to force uniqueness within a user project.
        project_id: the id of the project with which the objective being numbered belongs to.
        Objective: The Objective entity of the plannerApp database."""

    objectives = Objective.query.filter_by(project_id=project_id).all()
    if len(objectives)>0:
        objective_numbers = [objective.objective_number for objective in objectives]
        if objective_number:
            while objective_number in objective_numbers:
                objective_number+=1
            return objective_number

        if not objective_number:
            objective_number = len(objective_numbers) + 1
            while objective_number in objective_numbers:
                objective_number+=1
            return objective_number
        
    objective_number = 1
    return objective_number