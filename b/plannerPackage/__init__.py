from plannerPackage.bespoke_funcs import generate_config_dict
from .project_config import access_token_dur
from .project_config import refresh_token_dur
from .project_config import allowed_origins
from .routeHelper import token_required
from .routeHelper import login_required
from .routeHelper import update_refresh_token_table

#note: the dots are important. They tell python to look for the above modules in the directory of this file NOT the directory of the app execution command (i.e., dir = plannerPackage/b/  command = python main.py)
    # If you don't want to use relative imports you can use absolute import like "plannerPackage.bespoke_func import generate_config_dict" instead (note: it assumes that the app execution dir is plannerApp/b/ and not plannerApp/)