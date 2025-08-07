import re
from typing import Tuple, List, Dict
from cryptography.fernet import Fernet
from models import User, Refresh_Token, Project, Objective, Task
import json
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime

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
    """Filters a dictionary such that only the keys provided are returned. 
    Args:
        dict_obj: the dictionary being filtered
        keys: the keys to keep from the dict"""
    return dict(filter(lambda i: i[0] in keys, dict_obj.items()))


def decrypt_bespoke_session_cookie(cookie: str, serializer: URLSafeTimedSerializer, decryption_key: str) -> Dict:
    """Converts the 'bespoke session' cookie string to its original python dictionary which contains: logged_in, userId, username and refreshToken
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

def generate_entity_number(entity_number:int|None, parent_entity_id:int, parent_entity_name:str, entity_name:str, entity:Project|Objective|Task):
    """Generates an 'entity_number' which is an identifier for a child entity of a parent enitity. 
    Unlike entity_id, an entity_number does not have to be unique in the database rather it should be unique to 
    a specific parent entity (... To-do - UNLESS the entity is a recurring task as each recurring task group share the same task_number). 
    Args:
        entity_number: an (optional) suggestion for the entity number for the entity. Can be changed to force uniqueness within a user's enitity.
        parent_entity_id: the id of the parent entity with which the child entity being numbered belongs to (e.g., objective_id for a task|| user_id for a project).
        parent_entity_name: the (lowercase) name of the parent entity... (e.g., user, project, objective).
        entity_name: the (lowercase) name of the entity being numbered (e.g., project, objective, task).
        entity: the entity (class) object"""
    if parent_entity_name=="user":
        entities = entity.query.filter_by(user_id=parent_entity_id).all()
    elif parent_entity_name=="project":
        entities = entity.query.filter_by(project_id=parent_entity_id).all()
    elif parent_entity_name=="objective":
        entities = entity.query.filter_by(objective_id=parent_entity_id).all()
    else:
        raise Exception("The specified parent_entity_name in 'generate_entity_number()' is not one of: 'user', 'project' of 'objective'.")

    if len(entities)>0:
        entity_numbers = [getattr(entity, f'{entity_name}_number') for entity in entities]
        if entity_number:
            while entity_number in entity_numbers:
                entity_number+=1
            return entity_number

        if not entity_number:
            entity_number = max(set(entity_numbers)) + 1
            while entity_number in entity_numbers:
                entity_number+=1
            return entity_number
    else: 
        entity_number = 1
    return entity_number

def filter_list_of_dicts(L:List[Dict], key:str, value_comparison:str) -> Dict|None:
    """Filters a list of dictionaries (L) to return the first dictionary in 'L' whose key has a value = 'value_comparison'.
    Args:
        L: the list of dictionaries that is being filtered
        key: the whose value is compared to the 'value_comparison' param as part of the filter condition
        value_comparison: compared with the value of the dictionary key (Dict[key]) as part of the filter condition"""
    return list(filter(lambda dict_: dict_[key]==value_comparison, L))[0]
        

def generate_all_user_content(user_id:int) -> Tuple[List[Refresh_Token|None], List[Project|None], List[Objective|None], List[Task|None]]:
    """Generates a user's refresh_tokens, projects, objectives AND tasks"""
    refresh_tokens: List[Refresh_Token] = Refresh_Token.query.filter_by(user_id=user_id).all()
    projects: List[Project] = Project.query.filter_by(user_id = user_id).all() # a default project is created on user signs up
    project_ids: List[int] = [project.id for project in projects]
    objectives: List[List[Objective]] = [Objective.query.filter_by(project_id=id).all() for id in project_ids] # a default user project objective is created on a project's creation
    objectives_flattened: List[Objective] = flatten_2d_list(objectives)
    objective_ids: List[int] = [user_objective.id for user_objective in objectives_flattened]
    tasks: List[List[Task]] =  [Task.query.filter_by(objective_id=id).all() for id in objective_ids]
    tasks_flattened: List[Task] = flatten_2d_list(tasks)
    return refresh_tokens, projects, objectives_flattened, tasks_flattened

def generate_all_project_content(project_id:int) -> Tuple[List[Objective|None], List[Task|None]]:
    """Generates a projects's, objectives AND tasks"""
    objectives: List[Objective] = Objective.query.filter_by(project_id=project_id).all()
    objective_ids: List[int] = [objective.id for objective in objectives]
    tasks: List[List[Task]] =  [Task.query.filter_by(objective_id=id).all() for id in objective_ids]
    tasks_flattened: List[Task] = flatten_2d_list(tasks)
    return objectives, tasks_flattened

def generate_user_content(user_id:int, content:str)-> List[Refresh_Token] | List[Project]| List[Objective]| List[Task] | List[None]:
    """Generates a user's refresh tokens or projects, OR objectives or tasks.
    Args:
        content: the user content to return. Is not one of: 'refresh tokens', 'projects', 'objectives' or 'tasks'"""
    refresh_tokens, projects, objectives, tasks = generate_all_user_content(user_id=user_id)
    if content == "refresh tokens":
        return refresh_tokens
    elif content == "projects":
        return projects
    elif content == "objectives":
        return objectives
    elif content == "tasks":
        return tasks
    else:
        raise Exception("Content specified is not one of: 'refresh tokens', 'projects', 'objectives' or 'tasks' ")


def convert_date_str_to_datetime(date:str|datetime|None, format:str) -> datetime|None:
    if date == "":
        return None
    if isinstance(date, str) :
        return datetime.strptime(date, format)
    else:
        return date

def camel_to_snake_dict(camel_case_dict: Dict) ->Dict:
    """Converts keys of a dictionary from camelcase to snake case"""
    snake_case_dict = {}
    for key, value in camel_case_dict.items():
        # Convert camelCase key to snake_case
        snake_key = re.sub(r'(?<!^)([A-Z])', r'_\1', key).lower()
        # If the value is a dictionary, recursively convert its keys
        if isinstance(value, dict):
            value = camel_to_snake_dict(value)
        # Add the new key-value pair to the new dictionary
        snake_case_dict[snake_key] = value
    return snake_case_dict

def snake_to_camel_dict(snake_case_dict: Dict) -> Dict:
    """Convers keys of a dictionary from snake to camel case"""
    camel_case_dict = {}
    for key, value in snake_case_dict.items():
        # Convert snake_case key to camelCase
        camel_key = re.sub(r'_([a-z])', lambda match: match.group(1).upper(), key)
        # Add the new key-value pair to the new dictionary
        camel_case_dict[camel_key] = value
    return camel_case_dict