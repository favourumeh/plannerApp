import os
from dotenv import load_dotenv
import unittest 
from . import app
from . import db
from . import Project, Objective
from . import plannerAppTestDependecies
from datetime import datetime, timezone
from plannerPackage import filter_dict
from werkzeug.test import TestResponse
from typing import List, Dict

#Record test execution time
now: datetime = datetime.now(tz=timezone.utc)
now_str: str = datetime.strftime(now, '%Y-%m-%dT%H:%M:%S.%fZ')
now_str_long: str = datetime.strftime(now, "%a, %d %b %Y %H:%M:%S %Z").replace("UTC", "GMT")

#load env vars
load_dotenv()

#key params
objective_title_limit = int(os.environ["objective_title_limit"])

class FlaskAPIObjectiveTestCase(unittest.TestCase, plannerAppTestDependecies):

    def setUp(self):     
        self.client = app.test_client(use_cookies=True)
        with app.app_context():
            db.create_all()
    
    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    #MARK: Test READ_OBJS
    def test1_read_objective(self):
        username, pwd = "test", "ttt"
        print("\nTesting routes of Objective Blueprint")
        print("     1)Testing read_objectives")

        #Test Cases:
            #note: In standard_login_and_auth_test, a user is created/logged => creation of 'default project' 
        self.standard_login_and_auth_test(httpmethod="get", endpoint="/read-objectives", json_data=None, username=username, pwd=pwd)

            #create db entries
                #create user project 
        user_project = Project(id=2, description="user project desc", user_id=1)
                #create 2 objectives of type free object and project objective 
        free_objective = Objective(objective_number=1, title="Free Objective", type="free objective", project_id=1)
        project_objective = Objective(objective_number=1, title="Project Objective", project_id=2)
        
        with app.app_context():
            db.session.add(user_project)
            db.session.add(free_objective)
            db.session.add(project_objective)
            db.session.commit()
            
        print("         Test user requesting their objectives after login is successfull and yields the expected output")
        response = self.client.get("/read-objectives")
        objectives: List[Dict] = response.json["objectives"]
        filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId", "title", "type"]) for objective in objectives]
        self.assertTrue(response.status_code == 200)
        expected_output = [{'id': 1, 'objectiveNumber': 1, 'projectId': 1, 'title': 'Free Objective', 'type': 'free objective'}, 
                           {'id': 2, 'objectiveNumber': 1, 'projectId': 2, 'title': 'Project Objective', 'type': 'project objective'}]    
        self.assertListEqual(filtered_objectives, expected_output)

    #MARK: Test CREATE_OBJS
    def test2_create_objective(self):
        username, pwd = "test", "ttt"
        print("     2)Testing create_objective")

        #Test Cases:
            #note: In standard_login_and_auth_test, a user is signed up/logged in. Signup => creation of 'default project' 
        self.standard_login_and_auth_test(httpmethod="post", endpoint="/create-objective", 
                                          json_data={"title":"Test project objective", "projectId":1}, username=username, pwd=pwd)
        
        print("         Test requesting to create an objective without a project id fails")
        response = self.client.post("/create-objective", json={"title":"Test project objective"})
        self.assertEqual(response.json["message"], "Failure: Objective is missing a project ID. Please add one!")

        print("         Test requesting to create an objective for a project owned by another user fails")
        response = self.client.post("/create-objective", json={"title":"Test project objective", "projectId":51})
        self.assertEqual(response.json["message"], "Failure: User does not have any project in the db with the project ID provided.")

        print("         Test requesting to create an objective without a title fails")
        response = self.client.post("/create-objective", json={"projectId":1})
        self.assertEqual(response.json["message"], "Failure: objective is missing a title. Please add one.")
        
        print(f"         Test requesting to create an objective with title > {objective_title_limit} chars fails")
        response = self.client.post("/create-objective", json={"title":"1"*(objective_title_limit+1), "projectId":1})
        self.assertEqual(response.json["message"], f"Failure: The title has over {objective_title_limit} chars")        

        # #create a user project then edit it
        print("         Test request to create an objective (filled in all fields) succeeds")
        data = {"title":"Test User Project", "description":"test description", 
                "duration":10, "scheduledStart":now_str, "scheduledFinish":now_str, 
                "isCompleted":True, "tag":"test", "projectId":1}
        response = self.client.post(f"/create-objective", json=data)
        self.assertEqual(response.status_code, 201)
        response_read_projects = self.client.get("/read-objectives")
        created_objective: dict =  response_read_projects.json["objectives"][0]
        filtered_created_objective: dict = filter_dict(created_objective, list(data.keys()))
        data["scheduledStart"], data["scheduledFinish"] = now_str_long, now_str_long
        self.assertDictEqual(data, filtered_created_objective)

        
        #region auto-inc obj field
        print("             - Test auto-increment of objective_number field (no objective no. provided; new objective added to existing objectives)")
        expected_outcome = [{'id': 1, 'objectiveNumber': 1, 'projectId': 1}, 
                            {'id': 2, 'objectiveNumber': 2, 'projectId': 1}]
        self.client.post("/create-objective", json={"title":"test auto-inc", "projectId":1}) #no objective no. provided
        response_read_objectives = self.client.get("/read-objectives")
        objectives: List[Dict] = response_read_objectives.json["objectives"]
        filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
        self.assertEqual(filtered_objectives, expected_outcome)
        
        print("             - Test auto-increment of objective_number field (objective no. provided = existing; new objective added to existing objectives)")
        expected_outcome = [{'id': 1, 'objectiveNumber': 1, 'projectId': 1}, 
                            {'id': 2, 'objectiveNumber': 2, 'projectId': 1},
                            {'id': 3, 'objectiveNumber': 3, 'projectId': 1}]
        self.client.post("/create-objective", json={"title":"test auto-inc","objective_number":1, "projectId":1}) #objective_number already exists for project
        response_read_objectives = self.client.get("/read-objectives")
        objectives: List[Dict] = response_read_objectives.json["objectives"]
        filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
        self.assertEqual(filtered_objectives, expected_outcome)

        print("             - Test auto-increment of objective_number field (no objective no. provided; first objective added)")
        expected_outcome = [{'id': 5, 'objectiveNumber': 2, 'projectId': 2}]
        self.client.post("/create-project", json={"description":"boo"}) #create new project to simulate first objective. 
        self.client.post("/create-objective", json={"title":"test auto-inc", "projectId":2}) #no objective number specified
        response_read_objectives = self.client.get("/read-objectives")
        objectives: List[Dict] = list(filter(lambda project: project["type"]=="project objective", response_read_objectives.json["objectives"]))
        filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
        self.assertEqual(filtered_objectives, expected_outcome)

        print("             - Test auto-increment of objective_number field (objective no. provided is unique; first objective added)")
        expected_outcome = [{'id': 5, 'objectiveNumber': 2, 'projectId': 2},
                            {'id': 6, 'objectiveNumber': 3, 'projectId': 2}]
        self.client.post("/create-objective", json={"title":"test auto-inc", "objectiveNumber":2, "projectId":2}) #valid objective_number specified
        response_read_objectives = self.client.get("/read-objectives")
        objectives: List[Dict] = list(filter(lambda project: project["type"]=="project objective", response_read_objectives.json["objectives"]))
        filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
        self.assertEqual(filtered_objectives, expected_outcome)
        #endregion

        print("         Test that creating a project also creates a default objective which houses all objectiveless tasks")
        self.client.post("/create-project", json={"description":"blah"})
        resp_read_objectives = self.client.get("/read-objectives")
        objectives: List[Dict] = resp_read_objectives.json["objectives"]
        default_objective = list(filter(lambda objective: objective["type"]=="default objective", objectives))[0]
        self.assertTrue(default_objective["type"] == "default objective")

    #MARK: Test UPDATE_OBJS
    def test3_update_objective(self):
        username, pwd = "test", "ttt"
        username1 = "test1"
        print("     3)Testing update_objective")

        #Test Cases:
            #note: In standard_login_and_auth_test, user1 is signed up/logged in. Signup => creation of 'default project' 
        self.standard_login_and_auth_test(httpmethod="patch", endpoint="/update-objective/1", 
                                          json_data={"title":"User1's objective title"}, username=username, pwd=pwd)
        
            #create an objective for user1
        self.client.post("/create-objective", json={"title":"user1 title", "projectId":1}) #valid objective_number specified
        
        print("         Test request to update a non-existant objective fails")
        response = self.client.patch("/update-objective/51", json={"title":"blah"})
        self.assertEqual(response.json["message"], "Failure: Could not find the selected objective.")

            #signup and login new user then create an objective
        self.client.post("/sign-up", json={"username":username1, "password1":pwd, "password2":pwd})
        self.client.post("/login", json={"username":username1, "password":pwd})
        
        print("         Test request to update another user's objective fails")
        response = self.client.patch("/update-objective/1", json={"title":"blah"})
        self.assertEqual(response.json["message"], "Failure: The objective selected does not belong to the user.") 
        
            #create an objective for user2
        self.client.post("/create-objective", json={"title":"User2's objective title", "projectId":2}) #project_id=2 is the 'default project' created on user2 signup 

        print(f"         Test request with project title>{objective_title_limit} chars")
        response = self.client.patch("/update-objective/2", json={"title":"1"*(objective_title_limit+1)})
        self.assertEqual(response.json["message"], f"Failure: The title has over {objective_title_limit} chars")
        
        print("         Test request to update a user's objective (filled all fields) succeeds")
        data = {"title":"Test User Project", "description":"test description", 
                "duration":10, "scheduledStart":now_str, "scheduledFinish":now_str, 
                "isCompleted":True, "tag":"test"}
        response = self.client.patch(f"/update-objective/2", json=data)
        self.assertEqual(response.json["message"], "Success: Objective has been updated.")
        response_read_projects = self.client.get("/read-objectives")
        updated_objective: dict =  response_read_projects.json["objectives"][0]
        filtered_updated_objective: dict = filter_dict(updated_objective, list(data.keys()))
        data["scheduledStart"], data["scheduledFinish"] = now_str_long, now_str_long
        self.assertDictEqual(data, filtered_updated_objective)


    #MARK: Test DELETE_OBJS
    def test4_delete_objective(self):
        username, pwd = "test", "ttt" #username for user1
        username1 = "test1" #username for user2
        print("     4)Testing delete_objective")

        #Test Cases:
            #note: In standard_login_and_auth_test, a user is signed up/logged in. Signup => creation of 'default project' 
        self.standard_login_and_auth_test(httpmethod="delete", endpoint="/delete-objective/1", json_data=None, username=username, pwd=pwd)
            #create an objective for the default project created on signup
        self.client.post("/create-objective", json={"title":"blah", "projectId":1})
        
        print("         Test requesting to delete an objective that does not exist fails")
        response = self.client.delete("/delete-objective/245")
        self.assertEqual(response.json["message"], "Failure: The objective you are trying to delete does not exist.")
        
        print("         Test requesting to delete another user's objective fails")
        #signup and login new user then create an objective
        self.client.post("/sign-up", json={"username":username1, "password1":pwd, "password2":pwd})
        self.client.post("/login", json={"username":username1, "password":pwd})
        response = self.client.delete("/delete-objective/1") #objective with id =1 belongs to user1
        self.assertEqual(response.json["message"], "Failure: The objective selected does not belong to the user.")
        
        print("         Test requesting to delete an objective is successfull")
        self.client.post("/create-objective", json={"title":"blah", "projectId":2}) #objective with id =1 belongs to user1
        response = self.client.delete("/delete-objective/2")
        self.assertEqual(response.status_code, 200)

                
if __name__ == "__main__":
    unittest.main()