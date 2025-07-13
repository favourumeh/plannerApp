import os
from dotenv import load_dotenv
import unittest 
from . import app
from . import db
from . import Project, Objective
from . import plannerAppTestDependecies
from plannerPackage import filter_dict, filter_list_of_dicts
from werkzeug.test import TestResponse
from typing import List, Dict

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
        print("     \n1)Testing read_objectives")

        #Test Cases:
        #note: In standard_login_and_auth_test, a user is created/logged => creation of 'default project' and 'default objective' 
        self.standard_login_and_auth_test(httpmethod="get", endpoint="/read-objectives", json_data=None, username=username, pwd=pwd)

            #create db entries
                #create user project 
        user_project = Project(id=2, project_number=1, description="user project desc", user_id=1)
                #create 2 objectives of type free object and project objective 
        free_objective = Objective(objective_number=2, title="Free Objective", type="free objective", project_id=1)
        project_objective = Objective(objective_number=1, title="Project Objective", project_id=2)
        
        with app.app_context():
            db.session.add(user_project)
            db.session.add(free_objective)
            db.session.add(project_objective)
            db.session.commit()

        print("         Test that signing up creates a default project objective ...")
        print("         ...AND test user requesting their objectives after login is successfull and yields the expected output")
        filtered_objectives = self.read_and_filter_fields(read_endpoint="/read-objectives", entity="objectives", rel_fields=["id", "objectiveNumber", "projectId", "title", "type"])
        expected_output = [{'id': 1, 'objectiveNumber': 0, 'projectId': 1, 'title': 'No Objective', 'type': 'default project objective'},
                           {'id': 2, 'objectiveNumber': 1, 'projectId': 1, 'title': 'Break', 'type': 'break'}, 
                           {'id': 3, 'objectiveNumber': 2, 'projectId': 1, 'title': 'Free Objective', 'type': 'free objective'}, 
                           {'id': 4, 'objectiveNumber': 1, 'projectId': 2, 'title': 'Project Objective', 'type': 'project objective'}]
        self.assertListEqual(filtered_objectives, expected_output)

    #MARK: Test CREATE_OBJS
    def test2A_create_objective(self):
        username, pwd = "test", "ttt"
        print("     \n2A)Testing create_objective")

        #Test Cases:
        #note: In standard_login_and_auth_test, a user is created/logged => creation of 'default project' and 'default objective' 
        self.standard_login_and_auth_test(httpmethod="post", endpoint="/create-objective", 
                                          json_data={"title":"Test project objective", "projectId":1}, username=username, pwd=pwd)

        print("         Test requesting to create an objective without a project id fails")
        response: TestResponse = self.client.post("/create-objective", json={"title":"Test project objective"})
        self.assertEqual(response.json["message"], "Failure: Objective is missing a project ID. Please add one!")

        print("         Test requesting to create an objective for a project owned by another user fails")
        response: TestResponse = self.client.post("/create-objective", json={"title":"Test project objective", "projectId":51})
        self.assertEqual(response.json["message"], "Failure: User does not have any project in the db with the project ID provided.")

        print("         Test requesting to create an objective without a title fails")
        response: TestResponse = self.client.post("/create-objective", json={"projectId":1})
        self.assertEqual(response.json["message"], "Failure: objective is missing a title. Please add one.")
        
        print(f"         Test requesting to create an objective with title > {objective_title_limit} chars fails")
        response: TestResponse = self.client.post("/create-objective", json={"title":"1"*(objective_title_limit+1), "projectId":1})
        self.assertEqual(response.json["message"], f"Failure: The title has over {objective_title_limit} chars")        

        # #create a user project then edit it
        print("         Test request to create an objective (filled in most fields) succeeds")
        data = {"title":"Test User Project", "description":"test description", "status":"To-Do", "tag":"test", "projectId":1}
        
        response: TestResponse = self.client.post(f"/create-objective", json=data)
        self.assertEqual(response.status_code, 201)
        objectives_entries_filtered_fields = self.read_and_filter_fields("/read-objectives", "objectives", list(data.keys()))
        filter_created_objective: Dict = list(filter(lambda objective: objective["title"]==data["title"], objectives_entries_filtered_fields))[0]
        self.assertDictEqual(data, filter_created_objective)

        print("         Test that creating a project also creates a default user project objective which houses all objectiveless tasks for a project")
        self.client.post("/create-project", json={"title":"blah", "description":"blah"})
        resp_read_objectives = self.client.get("/read-objectives")
        objectives: List[Dict] = resp_read_objectives.json["objectives"]
        default_objective = list(filter(lambda objective: objective["type"]=="default user project objective", objectives))[0]
        self.assertTrue(default_objective["type"] == "default user project objective")

    # def test2B_generate_objective_number(self):
    #     #region auto-inc obj field
    #     print("     \n2b)Testing generate objective number")
    #     user_username, pwd = "test", "ttt"
    #     self.client.post("/sign-up", json={"username":user_username, "password1":pwd, "password2":pwd})
    #     self.client.post("/login", json={"username":user_username, "password":pwd})
    #     self.client.post("/create-project", json={"title":"project 2"}) #project 1 is default project created on login 
        
    #     print("             - Test auto-increment of objective_number field (no objective no. provided; new objective added to existing objectives)")
    #     expected_outcome = [{'id': 1, 'objectiveNumber': 1, 'projectId': 1}, 
    #                         {'id': 2, 'objectiveNumber': 2, 'projectId': 1}]
        
    #     self.client.post("/create-objective", json={"title":"test auto-inc", "projectId":1}) #no objective no. provided
    #     response_read_objectives = self.client.get("/read-objectives")
    #     objectives: List[Dict] = response_read_objectives.json["objectives"]
    #     filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
    #     self.assertEqual(filtered_objectives, expected_outcome)
        
    #     print("             - Test auto-increment of objective_number field (objective no. provided = existing; new objective added to existing objectives)")
    #     expected_outcome = [{'id': 1, 'objectiveNumber': 1, 'projectId': 1}, 
    #                         {'id': 2, 'objectiveNumber': 2, 'projectId': 1},
    #                         {'id': 3, 'objectiveNumber': 3, 'projectId': 1}]
    #     self.client.post("/create-objective", json={"title":"test auto-inc","objective_number":1, "projectId":1}) #objective_number already exists for project
    #     response_read_objectives = self.client.get("/read-objectives")
    #     objectives: List[Dict] = response_read_objectives.json["objectives"]
    #     filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
    #     self.assertEqual(filtered_objectives, expected_outcome)

    #     print("             - Test auto-increment of objective_number field (no objective no. provided; first objective added)")
    #     expected_outcome = [{'id': 5, 'objectiveNumber': 2, 'projectId': 2}]
    #     self.client.post("/create-project", json={"description":"boo"}) #create new project to simulate first objective. 
    #     self.client.post("/create-objective", json={"title":"test auto-inc", "projectId":2}) #no objective number specified
    #     response_read_objectives = self.client.get("/read-objectives")
    #     objectives: List[Dict] = list(filter(lambda project: project["type"]=="project objective", response_read_objectives.json["objectives"]))
    #     filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
    #     self.assertEqual(filtered_objectives, expected_outcome)

    #     print("             - Test auto-increment of objective_number field (objective no. provided is unique; first objective added)")
    #     expected_outcome = [{'id': 5, 'objectiveNumber': 2, 'projectId': 2},
    #                         {'id': 6, 'objectiveNumber': 3, 'projectId': 2}]
    #     self.client.post("/create-objective", json={"title":"test auto-inc", "objectiveNumber":2, "projectId":2}) #valid objective_number specified
    #     response_read_objectives = self.client.get("/read-objectives")
    #     objectives: List[Dict] = list(filter(lambda project: project["type"]=="project objective", response_read_objectives.json["objectives"]))
    #     filtered_objectives = [filter_dict(objective, ["id", "objectiveNumber", "projectId"]) for objective in objectives]
    #     self.assertEqual(filtered_objectives, expected_outcome)
    #     #endregion
    
    #MARK: Test UPDATE_OBJS
    def test3_update_objective(self):
        username, pwd = "test", "ttt"
        username1 = "test1"
        print("     \n3)Testing update_objective")

        #Test Cases:
            #note: In standard_login_and_auth_test, user1 is signed up/logged in. Signup => creation of 'default project' and 'default objective' 
        self.standard_login_and_auth_test(httpmethod="patch", endpoint="/update-objective/1", 
                                          json_data={"title":"User1's objective title"}, username=username, pwd=pwd)

        print("         Test request to update a non-existant objective fails")
        response: TestResponse = self.client.patch("/update-objective/51", json={"title":"blah"})
        self.assertEqual(response.json["message"], "Failure: Could not find the selected objective.")

            #signup and login new user then create an objective => creation of a 'default project' and 'default objective' 
        self.client.post("/sign-up", json={"username":username1, "password1":pwd, "password2":pwd})
        self.client.post("/login", json={"username":username1, "password":pwd})
        
        print("         Test request to update another user's objective fails")
        response: TestResponse = self.client.patch("/update-objective/1", json={"title":"blah"})
        self.assertEqual(response.json["message"], "Failure: The objective selected does not belong to the user.") 
        
        print("         Test attempting to update a default objective fails")
        response: TestResponse = self.client.patch("/update-objective/3", json={"title":"blah"})
        self.assertEqual(response.json["message"], "Failure: User is attempting to update a default objective which is not allowed.")
        
        print(f"         Test request with objective title>{objective_title_limit} chars fails")
        self.client.post("create-objective", json={"title":"blajh", "description":"blah", "projectId":"2"})
        response: TestResponse = self.client.patch("/update-objective/5", json={"title":"1"*(objective_title_limit+1)})
        self.assertEqual(response.json["message"], f"Failure: The title has over {objective_title_limit} chars")
        
        print("         Test requesting to update a default user project objective fails")
        self.client.post("/create-project", json={"title":"blah", "description":"blah"})  
        objectives: List[Dict] = self.client.get("/read-objectives").json["objectives"]
        default_user_project_objective: Dict = filter_list_of_dicts(objectives, "type", "default user project objective")
        response: TestResponse = self.client.patch(f"/update-objective/{default_user_project_objective['id']}", json={"title":"blah1"})
        self.assertEqual(response.json["message"], "Failure: User is attempting to update a default objective which is not allowed.")

        print("         Test request to update a user's objective (filled most fields) succeeds")
        self.client.post("/create-objective", json={"title":"User Objective for updating", "projectId":2})
        objectives: List[Dict] = self.client.get("/read-objectives").json["objectives"]
        user_objective: Dict = filter_list_of_dicts(objectives, "title", "User Objective for updating")
        data = {"title":"Test User Project", "description":"test description", "status":"To-Do", "tag":"test"}
        response: TestResponse = self.client.patch(f"/update-objective/{user_objective["id"]}", json=data)
        self.assertEqual(response.json["message"], "Success: Objective has been updated.")
        response_read_projects: TestResponse = self.client.get("/read-objectives")
        objectives: Dict =  response_read_projects.json["objectives"]
        updated_objective: Dict = filter_list_of_dicts(objectives, "title", "Test User Project")
        filtered_updated_objective: Dict = filter_dict(updated_objective, list(data.keys()))
        self.assertDictEqual(data, filtered_updated_objective)


    #MARK: Test DELETE_OBJS
    def test4_delete_objective(self):
        username, pwd = "test", "ttt" #username for user1
        username1 = "test1" #username for user2
        print("     \n4)Testing delete_objective")

        #Test Cases:
            #note: In standard_login_and_auth_test, a user is signed up/logged in. Signup => creation of 'default project' and 'default objective' 
        self.standard_login_and_auth_test(httpmethod="delete", endpoint="/delete-objective/1", json_data=None, username=username, pwd=pwd)

        print("         Test requesting to delete an objective that does not exist fails")
        response: TestResponse = self.client.delete("/delete-objective/245")
        self.assertEqual(response.json["message"], "Failure: The objective you are trying to delete does not exist.")

        #signup and login new user then create an objective=> creation of 'default project' and 'default objective' 
        self.client.post("/sign-up", json={"username":username1, "password1":pwd, "password2":pwd})
        self.client.post("/login", json={"username":username1, "password":pwd})

        print("         Test requesting to delete another user's objective fails")
        response: TestResponse = self.client.delete("/delete-objective/1") #objective with id =1 belongs to user1
        self.assertEqual(response.json["message"], "Failure: The objective selected does not belong to the user.")

        print("         Test requesting to delete a default project objective fails")
        objectives: List[Dict] = self.client.get("/read-objectives").json["objectives"]
        default_objective: Dict = filter_list_of_dicts(objectives, "type", "default project objective")
        response: TestResponse = self.client.delete(f"/delete-objective/{default_objective['id']}")
        self.assertEqual(response.json["message"], "Failure: User is attempting to delete a default objective which is not allowed.")

        print("         Test requesting to delete a default user project objective fails")
        self.client.post("/create-project", json={"title":"blah", "description":"blah"}) 
        objectives: TestResponse = self.client.get("/read-objectives").json["objectives"]
        default_user_project_objective = filter_list_of_dicts(objectives, "type", "default user project objective")
        response: TestResponse = self.client.delete(f"/delete-objective/{default_user_project_objective['id']}")
        self.assertEqual(response.json["message"], "Failure: User is attempting to delete a default objective which is not allowed.")
        
        
        print("         Test requesting to delete a user-created objective is successfull")
        user_project_id: int = filter_list_of_dicts(self.client.get("/read-projects").json["projects"], "userId", 2)["id"]
        self.client.post("/create-objective", json={"title":"objective to be deleted", "projectId":user_project_id})
        user_objective: Dict = filter_list_of_dicts(self.client.get("/read-objectives").json["objectives"], "title", "objective to be deleted")
        response: TestResponse = self.client.delete(f"/delete-objective/{user_objective['id']}")
        self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()