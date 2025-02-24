import os
from dotenv import load_dotenv
import unittest 
from . import app, serializer
from . import db
from . import User, Project, Refresh_Token
from datetime import datetime, timedelta, timezone
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash
from plannerPackage import decrypt_bespoke_session_cookie, filter_dict
from http.cookies import SimpleCookie

#Record test execution time
now: datetime = datetime.now(tz=timezone.utc)
now_str: str = datetime.strftime(now, '%Y-%m-%dT%H:%M:%S.%fZ')
now_str_long: str = datetime.strftime(now, "%a, %d %b %Y %H:%M:%S %Z")
load_dotenv()


def parse_cookie(cookie_string):
    cookie = SimpleCookie()
    cookie.load(cookie_string)
    return {key: morsel.value for key, morsel in cookie.items()}

class FlaskAPIProjectTestCase(unittest.TestCase):

    def setUp(self):     
        self.client = app.test_client(use_cookies=True)
        with app.app_context():
            db.create_all()
    
    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test1_create_project(self):
        project_title_limit = int(os.environ['project_title_limit'])
        username, pwd = "test", "ttt"
        print("Testing Project Blueprint")
        print("     1)Testing create_project")

        #Test cases 
        print("         Test accessing route without login(no bsc)")
        response = self.client.post("/create-project", json={"description":"fgsa"})
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")

        #signup and login #
        session_key = os.environ["session_key"]
        self.client.post("/sign-up", json={"username":username, "password1":pwd, "password2":pwd})
        self.client.post("/login", json={"username":username, "password":pwd})
        satc = self.client.get_cookie("session_AT").value #session_AT cookie(satc)

        print("         Test accessing route without login(no satc)")
        self.client.set_cookie(key="session_AT", value="", httponly=True, samesite="None", secure=True) #remove satc
        response = self.client.post("/create-project", json={"description":"fgsa"})
        self.assertEqual(response.json["message"], "Request is missing access token. Please login to refresh access token")
        self.client.set_cookie(key="session_AT", value=satc, httponly=True, samesite="None", secure=True) # add satc

        print("         Test creating a project is successfull")
        data = {"title":"Test User Project", "description":"test description", "isCompleted":True, "tag":"test", "deadline":now_str}
        response = self.client.post("/create-project", json=data)
        response_get_project = self.client.get("/read-projects")
        user_project = list(filter(lambda project: project["type"]=="user project", response_get_project.json["projects"]))[0]
        filtered_project = filter_dict(user_project, ["title", "description", "isCompleted", "tag", "deadline"])
        self.assertEqual(response.status_code, 201)
        data["deadline"] = now_str_long.replace("UTC", "GMT")
        self.assertDictEqual(filtered_project, data)

        print("         Test creating a project with no description fails")
        data = {"title":"Test User Project", "isCompleted":False, "tag":"test"}
        response = self.client.post("/create-project", json=data)
        self.assertEqual(response.json["message"], "Failure: Project is missing a description. Please add one.")
        
        print(f"         Test making a request with title is > {os.environ['project_title_limit']} chars fails")
        data = {"title":"12"*project_title_limit, "description":"blah", "isCompleted":False, "tag":"test"}
        response = self.client.post("/create-project", json=data)
        self.assertEqual(response.json["message"], f"Failure: The title has over {project_title_limit} chars")
    
if __name__ == "__main__":
    unittest.main()