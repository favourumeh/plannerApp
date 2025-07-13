import os
from dotenv import load_dotenv
import unittest 
from . import app
from . import db
from . import plannerAppTestDependecies
from . import now_str, now_str_long 
from datetime import datetime, timezone
from plannerPackage import filter_dict, filter_list_of_dicts
from werkzeug.test import TestResponse
from typing import List, Dict

#load env vars
load_dotenv()

#key params
project_title_limit = int(os.environ["project_title_limit"])

class FlaskAPIProjectTestCase(unittest.TestCase, plannerAppTestDependecies):

    def setUp(self):     
        self.client = app.test_client(use_cookies=True)
        with app.app_context():
            db.create_all()
    
    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test1_read_projects(self):
        username, pwd = "test", "ttt"
        print("\nTesting routes of Project Blueprint")
        print("     \n1)Testing read_project")
        
        #Test cases 
        self.standard_login_and_auth_test(httpmethod="get", endpoint="/read-projects", json_data=None , username=username, pwd=pwd)

        print("         Test accessing the route whilst logged succeeds")
        response: TestResponse = self.client.get("/read-projects")
        self.assertEqual(response.status_code, 200)
        
        print("         Test default project is created on sign up")
        user_projects: List[Dict] = self.read_and_filter_fields("/read-projects", "projects", ["id", "type"])
        default_project: Dict = list(filter(lambda project: project["type"]=="default project", user_projects))[0]
        self.assertEqual(default_project["type"], "default project")
        
    def test2_create_project(self):
        username, pwd = "test", "ttt"
        print("     \n2)Testing create_project")

        #Test cases 
        self.standard_login_and_auth_test(httpmethod="post", endpoint="/create-project", json_data={"description":"blah"} , username=username, pwd=pwd)

        print("         Test creating a project after login is successfull")
        data = {"title":"Test User Project", "description":"test description", "status":"To-Do", "tag":"test"}
        response: TestResponse = self.client.post("/create-project", json=data)
        response_get_project: TestResponse = self.client.get("/read-projects")
        user_project = list(filter(lambda project: project["type"]=="user project", response_get_project.json["projects"]))[0]
        filtered_project = filter_dict(user_project, ["title", "description", "status", "tag"])
        self.assertEqual(response.status_code, 201)
        self.assertDictEqual(data, filtered_project)

        print("         Test creating a project with no description fails")
        data = {"title":"Test User Project", "status":"To-Do", "tag":"test"}
        response: TestResponse = self.client.post("/create-project", json=data)
        self.assertEqual(response.json["message"], "Failure: Project is missing a description. Please add one.")
        
        print(f"         Test making a request with title is > {project_title_limit} chars fails")
        data = {"title":"1"*(project_title_limit+1), "description":"blah", "status":"To-Do", "tag":"test"}
        response: TestResponse = self.client.post("/create-project", json=data)
        self.assertEqual(response.json["message"], f"Failure: The title has over {project_title_limit} chars")

    def test3_update_projects(self):
        username, pwd = "test", "ttt"
        print("     \n3)Testing update_project")
        print("         note: bsc=bespoke_session cookie and satc=session_AT(access token) cookie.")
        
        #Test cases 
        self.standard_login_and_auth_test(httpmethod="patch", endpoint="/update-project/1", json_data={"description":"blah"}, username=username, pwd=pwd)
        
        print("         Test request to update the default project fails")
        response_read_projects: TestResponse = self.client.get("/read-projects")
        default_project_id: int = list(filter(lambda project: project["type"] == "default project", response_read_projects.json["projects"]))[0]["id"]
        response: TestResponse = self.client.patch(f"/update-project/{default_project_id}", json={"description":"blah"})
        self.assertEqual(response.json["message"], "Failure: User is attempting to edit the default project which is not allowed.")
        
        print("         Test request to update a non-existant project fails")
        response: TestResponse = self.client.patch("/update-project/5", json={"description":"blah"})
        self.assertEqual(response.json["message"], "Failure: Could not find the selected project in the db. Please choose another project id.")
        
        print("         Test attempting to update the default project fails")
        projects  = self.client.get("/read-projects").json["projects"]
        default_project_id: int = filter_list_of_dicts(projects, "type", "default project")["id"]
        response: TestResponse = self.client.patch(f"/update-project/{default_project_id}", json={"title":"blah", "description":"blah"})
        self.assertEqual(response.json["message"], "Failure: User is attempting to edit the default project which is not allowed.")
        
        #create a user project then edit it
        print("         Test request to update a user project succeeds")
        data = {"title":"title1", "description":"blah1"}
        self.client.post("/create-project", json=data)
        response_read_projects: TestResponse = self.client.get("/read-projects")
        user_project_id: int = list(filter(lambda project: project["type"]=="user project", response_read_projects.json["projects"]))[0]["id"]
        data = {"title":"Test User Project", "description":"test description", "status":"In-Progress", "tag":"test"}
        response: TestResponse = self.client.patch(f"/update-project/{user_project_id}", json=data)
        self.assertEqual(response.json["message"], "Success: Project has been updated.")
        response_read_projects: TestResponse = self.client.get("/read-projects")
        updated_project: dict = list(filter(lambda project: project["type"]=="user project", response_read_projects.json["projects"]))[0]
        filtered_updated_project: dict = filter_dict(updated_project, list(data.keys()))
        self.assertDictEqual(data, filtered_updated_project)

        print(f"         Test request with project title>{project_title_limit} chars")
        response: TestResponse = self.client.patch(f"/update-project/{user_project_id}", json={"title":"1"*(project_title_limit+1), "description":"blah"})
        self.assertEqual(response.json["message"], f"Failure: The title has over {project_title_limit} chars")
        
    def test4_delete_project(self):
        username, pwd = "test", "pwd"
        print("     \n4)Test delete_project")
        print("         note: bsc=bespoke_session cookie and satc=session_AT(access token) cookie.")

        #Test cases 
        self.standard_login_and_auth_test(httpmethod="delete", endpoint="/delete-project/1", json_data=None, username=username, pwd=pwd)

        print("         Test request to delete the 'default project' fails")
        response_read_projects: TestResponse = self.client.get("/read-projects")
        default_project_id = list(filter(lambda project: project["type"] == "default project", response_read_projects.json["projects"]))[0]["id"]
        response: TestResponse = self.client.delete(f"/delete-project/{default_project_id}")
        self.assertEqual(response.json["message"], "Failure: User is attempting to delete the default project which is not allowed.")

        print("         Test request to delete a user project succeeds")
        self.client.post("/create-project", json={"title":"blah", "description":"test user project"}) #create a user project        
        response_read_projects: TestResponse = self.client.get("/read-projects")
        user_project_id = list(filter(lambda project: project["type"] == "user project", response_read_projects.json["projects"]))[0]["id"]
        response: TestResponse = self.client.delete(f"/delete-project/{user_project_id}")
        self.assertEqual(response.json["message"], "Success: The project was successfully deleted!")



if __name__ == "__main__":
    unittest.main()