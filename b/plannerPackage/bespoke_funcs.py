from typing import Tuple, List, Dict
from cryptography.fernet import Fernet
from models import User, Refresh_Token, Project, Objective, Task
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


def generate_task_number(task_number: int|None, objective_id:int, Task: Task):
    """Generates an 'task_number' (an objective identifier that is specific to an objective). Unlike task_id
    an task_number does not have to be unique in the database rather it should be unique to a specific objective. 
    Args:
        task_number: the task number for the objective. Can be changed to force uniqueness within a user's objective.
        objective_id: the id of the objective with which the task being numbered belongs to.
        Task: The Task entity of the plannerApp database."""

    tasks = Task.query.filter_by(objective_id=objective_id).all()
    if len(tasks)>0:
        task_numbers = [task.task_number for task in tasks]
        if task_number:
            while task_number in task_numbers:
                task_number+=1
            return task_number

        if not task_number:
            task_number = len(task_numbers) + 1
            while task_number in task_numbers:
                task_number+=1
            return task_number
        
    task_number = 1
    return task_number


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
