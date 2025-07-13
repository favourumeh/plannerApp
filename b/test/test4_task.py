import os
from dotenv import load_dotenv
import unittest 
from . import app
from . import db
from . import Task
from . import plannerAppTestDependecies
from . import now_date_str, now_date_str_long
from plannerPackage import filter_list_of_dicts, snake_to_camel_dict
from werkzeug.test import TestResponse
from typing import List, Dict

#load env vars
load_dotenv()

#key params
task_description_limit = int(os.environ["task_description_limit"])

class FlaskAPITaskTestCase(unittest.TestCase, plannerAppTestDependecies):

    def setUp(self):
        self.maxDiff = None     
        self.client = app.test_client(use_cookies=True)
        with app.app_context():
            db.create_all()
    
    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test1_read_tasks(self):
        print("\nTesting routes of Task Blueprint")
        print("     \n1)Testing read_tasks")
        user1_username, pwd = "test", "ttt"
        user2_username = "test1"
        self.standard_login_and_auth_test("get", "/read-tasks", json_data=None, username=user1_username, pwd=pwd)

        #create a task and add it to the default project objective
        task_input = {"description":"Test task", "task_number":1, "duration_est":10, "objective_id":1}
        task_input_camelCase: Dict = snake_to_camel_dict(task_input)
        task = Task(**task_input)

        with app.app_context():
            db.session.add(task)
            db.session.commit()

        #Test Cases 
        print("         Test that read request after login is successfull")
        response = self.client.get("/read-tasks")
        task_entries_filtered_fields: list[dict] = self.read_response_field_filter(response=response, entity="tasks", rel_fields=list(task_input_camelCase.keys()))
        filter_tasks: Dict = list(filter(lambda task: task["description"]==task_input_camelCase["description"], task_entries_filtered_fields))[0]
        self.assertEqual(response.status_code, 200)
        self.assertDictEqual(task_input_camelCase, filter_tasks)
        
        #sign-up and login to user 2
        self.client.post("/sign-up", json={"username":user2_username, "password1":pwd, "password2":pwd})
        self.client.post("/login", json = {"username":user2_username, "password":pwd})

        print("         Test that a default objective, break objective and example task is created when a new user signs up")
        default_task = self.read_and_filter_fields("/read-tasks", "tasks", ["taskNumber", "type","objectiveId"])
        expected_outcome = [{"taskNumber":0, "type":"example task","objectiveId":3}]
        self.assertEqual(expected_outcome, default_task)
        default_and_break_objectives = self.read_and_filter_fields("/read-objectives", "objectives", ["objectiveNumber", "type","projectId"])
        expected_outcome = [{"objectiveNumber":0, "type":"default project objective","projectId":2}, {'objectiveNumber': 1, 'projectId': 2, 'type': 'break'}]
        self.assertEqual(expected_outcome, default_and_break_objectives)

    def test2A_create_tasks(self):
        print("     \n2A)Testing create_task")
        user1_username, pwd = "test", "ttt"
        user2_username = "test2"
        
        #note: In standard_login_and_auth_test, a user is created/logged => creation of 'default project' and 'default objective' 
        self.standard_login_and_auth_test("post", "/create-task", json_data=None, username=user1_username, pwd=pwd)

        #create an objective (assigned to the default project) for user1
        self.client.post("/create-objective", json={"title":"user1 objective", "projectId":1})
        user1_objectives: list[Dict] = self.read_and_filter_fields(read_endpoint="/read-objectives", entity="objectives", rel_fields=["id", "title"])
        user1_objective_id: int = list(filter(lambda objective: objective["title"]=="user1 objective", user1_objectives))[0]["id"]

        #create user2, login and create a objective (assinged to default project)
        self.client.post("/sign-up", json={"username":user2_username, "password1":pwd, "password2":pwd})
        self.client.post("/login", json = {"username":user2_username, "password":pwd})
        self.client.post("/create-objective", json ={"title":"user2 objective", "projectId":2})
        user2_objectives: list[Dict] = self.read_and_filter_fields(read_endpoint="/read-objectives", entity="objectives", rel_fields=["id", "title"])
        user2_objective_id: int = list(filter(lambda objective: objective["title"]=="user2 objective", user2_objectives))[0]["id"]

        #login to user1
        self.client.post("/login", json={"username":user1_username, "password":pwd})

        #Test Cases 
        print("         Test that requests without objective id fails")
        task_input = {"description":"Test task", "taskNnumber":1, "duration_est":10}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.json["message"], "Failure: Objective ID missing. The Task is not assigned any project.")

        print("         Test that requests with an invalid objective id fails")
        task_input = {"description":"Test task", "taskNnumber":1, "duration_est":10, "objectiveId":51}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.json["message"], "Failure: The Objective ID provided does not exist.")

        print("         Test that requests made with another user's objective id fails")
        task_input = {"description":"Test task", "taskNumber":1, "duration_est":10, "objectiveId":user2_objective_id}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.json["message"], "Failure: The specified objective does not belong to the user.")

        print("         Test that requests made without task description fails")
        task_input = {"taskNumber":1, "duration_est":10, "objectiveId":1}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.json["message"], "Failure: Task is missing a description.")

        print(f"         Test that requests made with description > {task_description_limit} fails")
        task_input = {"description":"1"*(task_description_limit+1), "taskNumber":1, "duration_est":10, "objectiveId":1}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.json["message"], f"Failure: The description is over the {task_description_limit} char limit.")

        print("         Test that requests made without task duration_est fails")
        task_input = {"description":"blah", "taskNumber":1, "objectiveId":1}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.json["message"], "Failure: Task is missing a duration_est (mins).")

        print("         Test that create task request after login is successfull")
        task_input = {"description":"Test task", "taskNumber":1, "durationEst":10, "objectiveId":1}
        response = self.client.post("/create-task", json=task_input)
        task_entries_filtered_fields: list[dict] = self.read_and_filter_fields(read_endpoint="/read-tasks", entity="tasks", rel_fields=list(task_input.keys()))
        filter_tasks: Dict = list(filter(lambda task: task["description"]==task_input["description"], task_entries_filtered_fields))[0]
        self.assertEqual(response.status_code, 201)
        self.assertDictEqual(task_input, filter_tasks)

        print("         Test that user can create task without specifying a task number")
        task_input = {"description":"Test task", "durationEst":10, "objectiveId":1}
        response = self.client.post("/create-task", json=task_input)
        task_entries_filtered_fields: list[dict] = self.read_and_filter_fields(read_endpoint="/read-tasks", entity="tasks", rel_fields=list(task_input.keys()))
        filter_tasks: Dict = list(filter(lambda task: task["description"]==task_input["description"], task_entries_filtered_fields))[0]
        self.assertEqual(response.status_code, 201)
        self.assertDictEqual(task_input, filter_tasks)

        print("         Test that user can create a task after creating a project due to the creation of the 'default user project objective'")
        self.client.post("/create-project", json={"title":"blah", "description":"user-created project"})
        default_objective: List[Dict] = self.read_and_filter_fields("/read-objectives", "objectives", ["id", "type"])
        default_objective_id: int = filter_list_of_dicts(default_objective, "type", "default user project objective")["id"]
        task_input = {"description":"Task 'without' objective", "durationEst":10, "objectiveId":default_objective_id}
        response = self.client.post("/create-task", json=task_input)
        self.assertEqual(response.status_code, 201)

        print("         Test requesting to update a task after login succeeds")
        create_task_input = {"description":"created user1 task", "durationEst":20, "priorityScore":2,
                             "scheduledStart":now_date_str, "status":"To-Do",
                             "isRecurring":True, "tag":"test", "objectiveId":user1_objective_id}
        response = self.client.post(f"/create-task", json=create_task_input) 
        self.assertEqual(response.status_code, 201)
        rel_fields = list(create_task_input.keys())
        field_filter_tasks: List[Dict] = self.read_and_filter_fields(read_endpoint="read-tasks", entity="tasks", rel_fields=rel_fields)
        updated_task = filter_list_of_dicts(field_filter_tasks, "description", "created user1 task")
        create_task_input["scheduledStart"] = now_date_str_long
        self.assertDictEqual(create_task_input, updated_task)

    # def test2B_generate_task_number(self):
    #     print("     \n2b)Testing generate task number")
    #     user_username, pwd = "test", "ttt"
    #     self.client.post("/sign-up", json={"username":user_username, "password1":pwd, "password2":pwd})
    #     self.client.post("/login", json={"username":user_username, "password":pwd})

    #     print("         TaskNumber field when not specified and when no other task in the user's objective defaults to 1")
    #     expected_outcome = [{'id': 1, 'taskNumber':1, "description":"Test 1", "duration":10, 'objectiveId':1}] 
    #     task_input = {"description":"Test 1", "duration":10, "objectiveId":1}
    #     self.client.post("/create-task", json=task_input)
    #     field_filtered_output = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "taskNumber", "description", "duration", "objectiveId"])
    #     self.assertListEqual(expected_outcome, field_filtered_output)
        
    #     print("         TaskNumber generated when no task no. provided AND NON-mpty task table succeeds")
    #     expected_outcome = [{'id': 1, 'taskNumber':1, "description":"Test 1", "duration":10, 'objectiveId':1},
    #                         {'id': 2, 'taskNumber':2, "description":"Test 2", "duration":10, 'objectiveId':1} ] 
    #     task_input = {"description":"Test 2", "duration":10, "objectiveId":1}
    #     self.client.post("/create-task", json=task_input)
    #     field_filtered_output = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "taskNumber", "description", "duration", "objectiveId"])
    #     self.assertListEqual(expected_outcome, field_filtered_output)
        
    #     print("         TaskNumber specified in request is used given its is not already in the db")
    #     expected_outcome = [{'id': 1, 'taskNumber':1, "description":"Test 1", "duration":10, 'objectiveId':1},
    #                         {'id': 2, 'taskNumber':2, "description":"Test 2", "duration":10, 'objectiveId':1},
    #                         {'id': 3, 'taskNumber':3, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 4, 'taskNumber':4, "description":"Test 3", "duration":10, 'objectiveId':1}] 
    #     task_input = {"description":"Test 3", "taskNumber":3, "duration":10, "objectiveId":1} #newTasknumber
    #     self.client.post("/create-task", json=task_input)
    #     task_input = {"description":"Test 3", "taskNumber":2, "duration":10, "objectiveId":1} #existing taskNumber
    #     self.client.post("/create-task", json=task_input)
    #     field_filtered_output = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "taskNumber", "description", "duration", "objectiveId"])
    #     self.assertListEqual(expected_outcome, field_filtered_output)
        
    #     print("         TaskNumber field when NOT specified in request resets to number of tasks inspite of a large outlier tasknumber in db")
    #     expected_outcome = [{'id': 1, 'taskNumber':1, "description":"Test 1", "duration":10, 'objectiveId':1},
    #                         {'id': 2, 'taskNumber':2, "description":"Test 2", "duration":10, 'objectiveId':1},
    #                         {'id': 3, 'taskNumber':3, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 4, 'taskNumber':4, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 5, 'taskNumber':57, "description":"Test 4", "duration":10, 'objectiveId':1},
    #                         {'id': 6, 'taskNumber':6, "description":"Test 4", "duration":10, 'objectiveId':1}]
    #     task_input = {"description":"Test 4", "taskNumber":57, "duration":10, "objectiveId":1}
    #     self.client.post("/create-task", json=task_input)
    #     task_input = {"description":"Test 4", "duration":10, "objectiveId":1}
    #     self.client.post("/create-task", json=task_input)
    #     field_filtered_output = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "taskNumber", "description", "duration", "objectiveId"])
    #     #print("output dict:", field_filtered_output)
    #     self.assertListEqual(expected_outcome, field_filtered_output)

    #     print("         TaskNumber field increments pasts the number of user's tasks in db when not specifed to avoid IF that taskNumber is already used")
    #     expected_outcome = [{'id': 1, 'taskNumber':1, "description":"Test 1", "duration":10, 'objectiveId':1},
    #                         {'id': 2, 'taskNumber':2, "description":"Test 2", "duration":10, 'objectiveId':1},
    #                         {'id': 3, 'taskNumber':3, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 4, 'taskNumber':4, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 5, 'taskNumber':57, "description":"Test 4", "duration":10, 'objectiveId':1},
    #                         {'id': 6, 'taskNumber':6, "description":"Test 4", "duration":10, 'objectiveId':1},
    #                         {'id': 7, 'taskNumber':8, "description":"Test 5", "duration":10, 'objectiveId':1},
    #                         {'id': 8, 'taskNumber':9, "description":"Test 5", "duration":10, 'objectiveId':1}]
    #     task_input = {"description":"Test 5", "taskNumber":8,"duration":10, "objectiveId":1}
    #     self.client.post("/create-task", json=task_input)
    #     task_input = {"description":"Test 5", "duration":10, "objectiveId":1}
    #     self.client.post("/create-task", json=task_input)
    #     field_filtered_output = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "taskNumber", "description", "duration", "objectiveId"])
    #     #print("output dict:", field_filtered_output)
    #     self.assertListEqual(expected_outcome, field_filtered_output)

    #     print("         TaskNumber field restart to 1 when creating a task for a new objective")
    #     self.client.post("/create-objective", json={"title":"user-created objective 2", "projectId":1}) #create new objective in proj 1
    #     expected_outcome = [{'id': 1, 'taskNumber':1, "description":"Test 1", "duration":10, 'objectiveId':1},
    #                         {'id': 2, 'taskNumber':2, "description":"Test 2", "duration":10, 'objectiveId':1},
    #                         {'id': 3, 'taskNumber':3, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 4, 'taskNumber':4, "description":"Test 3", "duration":10, 'objectiveId':1},
    #                         {'id': 5, 'taskNumber':57, "description":"Test 4", "duration":10, 'objectiveId':1},
    #                         {'id': 6, 'taskNumber':6, "description":"Test 4", "duration":10, 'objectiveId':1},
    #                         {'id': 7, 'taskNumber':8, "description":"Test 5", "duration":10, 'objectiveId':1},
    #                         {'id': 8, 'taskNumber':9, "description":"Test 5", "duration":10, 'objectiveId':1},
    #                         {'id': 9, 'taskNumber':1, "description":"Test 6", "duration":10, 'objectiveId':2}]
    #     task_input = {"description":"Test 6", "taskNumber":8,"duration":10, "objectiveId":2}
    #     self.client.post("/create-task", json=task_input)
    #     field_filtered_output = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "taskNumber", "description", "duration", "objectiveId"])
    #     self.assertListEqual(expected_outcome, field_filtered_output)

    def test3_update_task(self):
        print("     \n3)Testing update_task")
        user1_username, pwd = "test", "ttt"
        user2_username = "test2"

        #note: In standard_login_and_auth_test, a user is created/logged => creation of 'default project' and 'default objective'         
        self.standard_login_and_auth_test("patch", "/update-task/1", json_data=None, username=user1_username, pwd=pwd)

        #create a task for user1 (connected to the default objective and default project created on signup)
        self.client.post("/create-task", json={"description":"user1 task", "durationEst":10, "objectiveId":1})
        user1_task_id: int = self.read_and_filter_fields("/read-tasks", "tasks", ["id"])[0]["id"]

        #signup and login user2 => creation of 'default project' and 'default objective'
        self.client.post("/sign-up", json={"username":user2_username, "password1":pwd, "password2":pwd})
        self.client.post("/login", json = {"username":user2_username, "password":pwd})
        
        #create a task for user2, (connected to the default objective and default project created on signup)
        self.client.post("/create-task", json={"description":"user2 task", "durationEst":10, "objectiveId":3})
        field_filtered_tasks: List[Dict] = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "description", "objectiveId"])
        user2_task_id: int = filter_list_of_dicts(field_filtered_tasks, "description", "user2 task")["id"]
        user2_objective_id: int = filter_list_of_dicts(field_filtered_tasks, "description", "user2 task")["objectiveId"]

        #Test cases
        print("         Test updating a non-existent task fails")
        response = self.client.patch("/update-task/56")
        self.assertEqual(response.json["message"], "Failure: The task referenced does not exist.")

        print("         Test requesting to update another user's task fails")
        response = self.client.patch(f"/update-task/{user1_task_id}") 
        self.assertEqual(response.json["message"], "Failure: The task referenced does not belong to user.")

        print(f"         Test requesting to update a task with a description > {task_description_limit} chars fails")
        response = self.client.patch(f"/update-task/{user2_task_id}", json={"description":"1"*(task_description_limit+1)}) 
        self.assertEqual(response.json["message"], f"Failure: The task description is over the {task_description_limit} char limit.")

        print("         Test requesting to update a task after login succeeds")
        task_update_input = {"description":"updated user2 task", "durationEst":20, "priorityScore":2,
                             "scheduledStart":now_date_str, "status":"In-Progress",
                             "isRecurring":True, "tag":"test","objectiveId":user2_objective_id}
        response = self.client.patch(f"/update-task/{user2_task_id}", json=task_update_input) 
        self.assertEqual(response.status_code, 200)
        rel_fields = ["id"] + list(task_update_input.keys())
        field_filter_tasks: List[Dict] = self.read_and_filter_fields(read_endpoint="read-tasks", entity="tasks", rel_fields=rel_fields)
        updated_task = filter_list_of_dicts(field_filter_tasks, "id", user2_task_id)
        task_update_input["id"] = user2_task_id
        task_update_input["scheduledStart"] = now_date_str_long
        self.assertDictEqual(task_update_input, updated_task)

    def test4_delete_task(self):
        print("     \n4)Testing delete_task")
        user1_username, pwd = "test", "ttt"
        user2_username = "test2"
        self.standard_login_and_auth_test("delete", "/delete-task/1", json_data=None, username=user1_username, pwd=pwd)

        #create a project (and thus default user project objective) and task for user1
        self.client.post("/create-task", json={"description":"user1 task", "durationEst":10, "objectiveId":1})
        user1_task_id: int = self.read_and_filter_fields("/read-tasks", "tasks", ["id"])[0]["id"]

        #create user2, login and create a project (and thus default user project objective)
        self.client.post("/sign-up", json={"username":user2_username, "password1":pwd, "password2":pwd})
        self.client.post("/login", json={"username":user2_username, "password":pwd})
        self.client.post("/create-task", json={"description":"user2 task", "durationEst":10, "objectiveId":3})
        field_filtered_tasks: List[Dict] = self.read_and_filter_fields("/read-tasks", "tasks", ["id", "description"])
        user2_task_id: int = filter_list_of_dicts(field_filtered_tasks, "description", "user2 task")["id"]

        #Test cases
        print("         Test attempting to delete a non-existent task fails")
        response = self.client.delete("/delete-task/56")
        self.assertEqual(response.json["message"], "Failure: The task referenced does not exist.")

        print("         Test attempting to delete another user's task fails")
        response = self.client.delete(f"/delete-task/{user1_task_id}") 
        self.assertEqual(response.json["message"], "Failure: The task referenced does not beloing to user.")
        
        print("         Test attempting to delete a task after login succeeds")
        response = self.client.delete(f"/delete-task/{user2_task_id}") 
        self.assertEqual(response.status_code, 200)