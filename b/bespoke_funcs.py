from typing import List, Dict

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