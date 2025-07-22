import unittest 
import os
import time
from . import app, serializer
from . import db, User, Refresh_Token, Project
from . import plannerAppTestDependecies
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash
from werkzeug.test import TestResponse
from plannerPackage import filter_dict, decrypt_bespoke_session_cookie, session_key
from pytz import timezone

#Record test execution time
now = datetime.now(tz=timezone('Europe/London'))

class FlaskAPIAuthTestCase(unittest.TestCase, plannerAppTestDependecies):

    def setUp(self):
        """This is a hook method that is executed before each test method. Function: An app client is created for each test method to make request to the backend api. 
        All the entity tables for the db are also create as they are wipped by the other hook method,'tearDown', after each test method is executed. """
        self.client = app.test_client(use_cookies=True) # this client makes requests to the backend app's api.
        with app.app_context(): 
            db.create_all()

    def tearDown(self):
        """This is a hook method that is executed after each test method. Function: The database table for each entity is wipped after each test method"""
        with app.app_context():
            db.session.remove()
            db.drop_all()
            
    def test0_A_test_login_required(self):
        print(f"\nTest time: {str(now.time()).split(".")[0]}. (date = {now.date()}) ------------------------")
        print("Testing Auth Blueprint")
        print("     \n0A)Test login_required decorator")
        print("         notes: bsc = bespoke_session cookie")
        username, pwd = "test", "ttt"
        expired_bsc = os.environ["expired_bespoke_session_cookie"]

        #Test Cases:
        print("         Test accessing route without bsc fails")
        response: TestResponse = self.client.get("/api/test-login-required")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")
        
        print("         Test accessing route with an invalid bsc (i.e., bsc could not be decrypted, signed or deserialised)")
        self.client.set_cookie(key="bespoke_session", value="fasdfsad", httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-login-required")
        self.assertEqual(response.json["message"].split(". Reason")[0], "Failure: Could not decrypt the bespoke_session cookies")      

        print("         Test accessing route whilst logged in succeeds")
        user = User(username=username, password=generate_password_hash(pwd, "pbkdf2"))
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        login_response: TestResponse = self.client.post("/api/login", json = {"username":username, "password":pwd})
        bsc = self.client.get_cookie("bespoke_session").value
        response: TestResponse = self.client.get("/api/test-login-required")
        self.assertEqual(response.status_code, 200)

        print("         Test accessing route after user has logged out with the previous bsc fails (i.e., user has no refresh_token entry in db but has a bsc)")        
        logout_response: TestResponse = self.client.get("/api/logout")
        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-login-required")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no rt). Please login!")

        print("         Test accessing route with an mismatched rt in bsc fails (i.e., user's rt in bsc is different to db rt)")
        login_response2: TestResponse = self.client.post("/api/login", json={"username":username, "password":pwd})
        login_bsc = self.client.get_cookie("bespoke_session").value
        self.client.set_cookie(key="bespoke_session", value=expired_bsc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-login-required")
        self.assertEqual(response.json["message"], "Failure: Refresh token is invalid. Please login")
            #logout - must logout with the bsc used to login (i.e. login_bsc) otherwise logout fails
        self.client.set_cookie(key="bespoke_session", value=login_bsc, httponly=True, samesite="None", secure=True)
        logout_response2: TestResponse = self.client.get("/api/logout")
        
        print("         Test accessing route with expired with bsc containing expired rt fails (i.e. bsc rt == db rt but db's exp field in the past)")
        expired_rt = decrypt_bespoke_session_cookie(expired_bsc, serializer, session_key)["refreshToken"]
        expired_rt_hash = generate_password_hash(expired_rt, "pbkdf2")
        refresh_token_obj = Refresh_Token(token=expired_rt_hash, exp=now-timedelta(days=1), user_id=1)
        with app.app_context():
            db.session.add(refresh_token_obj)
            db.session.commit()
        self.client.set_cookie(key="bespoke_session", value=expired_bsc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-login-required")
        self.assertEqual(response.json["message"], "Failure: Please login. Refresh token has expired.")
        
    def test0_B_test_token_required(self):
        print("     \n0B)Test token_required decorator")
        print("         note1: satc = session_AT cookie.\n         note2: All tests are made with after user login is verified.")
        expired_satc = os.environ["expired_access_token_cookie"]
        username, pwd = "test", "ttt"
        user = User(username=username, password=generate_password_hash(pwd, "pbkdf2"))
        with app.app_context():
            db.session.add(user)
            db.session.commit()
            
        login_response: TestResponse = self.client.post("/api/login", json={"username":username, "password": pwd})
        satc = self.client.get_cookie("session_AT").value
        
        #Test cases 
        print("         Test that access the route with a satc works")
        response: TestResponse = self.client.get("/api/test-token-required")
        self.assertEqual(response.status_code, 200)
        
        print("         Test access route without satc fails")
        self.client.set_cookie(key="session_AT", value="", httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-token-required")
        self.assertEqual(response.json["message"], "Request is missing access token. Please login to refresh access token")
        
        print("         Test access route with an invalid access_token fails (i.e., Deserialisation/signature fails)")
        self.client.set_cookie(key="session_AT", value="fasdfs", httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-token-required")
        self.assertEqual(response.json["message"].split("! Reason: ")[0], "Deserialisation or Signiture verificaiton of access token cookie has failed")

        print("         Test access route with an expired access_token fails")
        self.client.set_cookie(key="session_AT", value=expired_satc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/test-token-required")
        self.assertEqual(response.json["message"].split("! Reason: ")[0], "Invalid Access Token")
        self.assertEqual(response.json["message"].split("! Reason: ")[-1], "Signature has expired")
        
        
    def test1_signup(self):
        print("     \n1)Testing test_signup")
        #Add a user entry to the user table of the in-memory db
        username1, pwd = "test", "ttt"
        username2, username3 = "test1", "test2"
        email1, email3 = "test@test.com", "example@exmaple.com"
        user = User(username=username1, password=pwd, email=email1)
        with app.app_context():
            db.session.add(user)
            db.session.commit()

        #Test cases:
        print("         Test valid signup input")
        data = {"username":username2, "password1":pwd, "password2":pwd} 
        response: TestResponse = self.client.post("/api/sign-up", json = data )
        self.assertEqual(response.status_code, 201)

        print("         Test Valid Input w/email")
        data = {"username":username3, "password1":pwd, "password2":pwd, "email": email3} 
        response: TestResponse = self.client.post("/api/sign-up", json = data )
        self.assertEqual(response.status_code, 201)
        
        print("         Test invlaid Input - blank or NO username provided")
        data = {"username":"", "password1":"ttt", "password2":"ttt"}
        response: TestResponse = self.client.post("/api/sign-up", json=data)
        self.assertEqual(response.json["message"], "Failure: Username is missing!")
        data = {"password1":"ttt", "password2":"ttt"}
        response: TestResponse = self.client.post("/api/sign-up", json=data)
        self.assertEqual(response.json["message"], "Failure: Username is missing!")
        
        print("         Test invalid Input - existing user in db")
        data = {"username":username1, "password1": pwd, "password2": pwd} 
        response: TestResponse = self.client.post("/api/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Username is taken. Please choose another one."})
        self.assertEqual(response.status_code, 400)
        
        print("         Test invalid Input - username too long")
        data = {"username":"test"*4, "password1": "ttt1", "password2": "ttt"} 
        response: TestResponse = self.client.post("/api/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Username is too long. Must be <= 15 characters."})
        self.assertEqual(response.status_code, 400)
               
        print("         Test invalid Input - existing email in db")
        data = {"username":"test4", "password1": "ttt", "password2": "ttt", "email": "test@test.com"} 
        response: TestResponse = self.client.post("/api/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is taken. Please choose another one."})
        self.assertEqual(response.status_code, 400)
    
        print("         Test invalid Input - email too long")
        data = {"username":"test5", "password1": "ttt", "password2": "ttt", "email": "test@test."+"com"*110} 
        response: TestResponse = self.client.post("/api/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is too long. Must be <= 120 characters."})
        self.assertEqual(response.status_code, 400)
        
        print("         Test invalid Input - invalid email")
        data = {"username":"test6", "password1": "ttt", "password2": "ttt", "email": "blah@blah"} 
        response: TestResponse = self.client.post("/api/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is not valid"})
        
        print("         Test invalid Input - password mismatch")
        data = {"username":"test7", "password1": "ttt1", "password2": "ttt"} 
        response: TestResponse = self.client.post("/api/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Passwords do not match"})
        self.assertEqual(response.status_code, 400)

    def test2_login(self):
        print("     \n2)Testing login")
        #Add a user entry to the user table of the in-memory db
        username, pwd, email = "test", "ttt", "test@test.com"
        data = {"username":username, "password1":pwd, "password2":pwd, "email": email} 
        signup_response: TestResponse = self.client.post("/api/sign-up", json=data)
        
        print("         Test valid input - refresh token creation")
        data = {"username": username, "password":pwd}
        response: TestResponse = self.client.post("/api/login", json = data)
        self.assertEqual(response.json["user"], {"id":1, "username": "test"})
        self.assertEqual(response.status_code, 200)

        print("         Test invalid input - user not found")
        data = {"username": "test1", "password":pwd}
        response: TestResponse = self.client.post("/api/login", json = data)
        self.assertEqual(response.json["message"], "Failure: User not found")
               
        print("         Test invalid input - incorrect password")
        data = {"username": username, "password":"ttt1"}
        response: TestResponse = self.client.post("/api/login", json = data)
        self.assertEqual(response.json["message"], "Failure: Incorrect password")

    def test3_logout(self):
        print("     \n3)Testing logout ")
        #create account
        username, pwd = "test","ttt"
        user: User = User(username=username, password=generate_password_hash(pwd))
        with app.app_context():
            db.session.add(user)
            db.session.commit()

        #Test Cases 
        print("         Test accessing the route whilst not logged in fails - (c: no bespoke session cookie)")
        response: TestResponse = self.client.get("/api/logout")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")

            #login 
        login_response: TestResponse = self.client.post("/api/login", json={"username":username, "password":pwd})
        print("         Test successful logout")
        response: TestResponse = self.client.get("/api/logout")
        self.assertEqual(response.status_code, 200)
        
        print("         Test accessing the route whilst not logged in fails - (c: no refresh token)")
        bsc = os.environ["expired_bespoke_session_cookie"]
        self.client.set_cookie(key="bespoke_session", value=bsc,httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/logout")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no rt). Please login!")

    def test4_refresh(self):
        print("     \n4)Testing refresh ")
        #create account
        username, pwd = "test","ttt"
        user: User = User(username=username, password=generate_password_hash(pwd))
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        
        #import an expired bespoke session cookie and decryption key
        bsc = os.environ["expired_bespoke_session_cookie"]
        sk = session_key

        #Test Cases 
        print("         Test accessing the route whilst not logged in fails - (c: no bespoke_session cookie)")
        response: TestResponse = self.client.get("/api/refresh")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")

        print("         Test accessing the route whilst not logged in fails - (c: no refresh token)")
        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/refresh")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no rt). Please login!")

        print("         Test accessing the route with an expired refresh token fails")
        exp: datetime = datetime.now(tz=timezone('Europe/London')) - timedelta(days =1)
        token = decrypt_bespoke_session_cookie(cookie=bsc, serializer=serializer, decryption_key=sk)["refreshToken"]
        token_hash = generate_password_hash(token, method = "pbkdf2")
        refresh_token_obj: Refresh_Token = Refresh_Token(token=token_hash, exp=exp, user_id=1)  
        with app.app_context():
            db.session.add(refresh_token_obj)
            db.session.commit()

        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/refresh")
        self.assertEqual(response.json["message"], "Failure: Please login. Refresh token has expired.")
        
            #login
        login_response: TestResponse = self.client.post("/api/login", json={"username":username, "password":pwd})
        
        print("         Test successful request")
        response: TestResponse = self.client.get("/api/refresh")
        self.assertEqual(response.status_code, 200)

        print("         Test accessing the route with an invalid refresh token fails")
        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response: TestResponse = self.client.get("/api/refresh")
        self.assertEqual(response.json["message"], "Failure: Refresh token is invalid. Please login")
        
    def test5_delete_user(self):
        print("     \n5)Testing delete-user")
        username, pwd = "test","ttt"

        self.standard_login_and_auth_test(httpmethod="delete", endpoint="/api/delete-user/1", json_data=None, username=username, pwd=pwd)

        print("         Test invalid input - deleting someone else's account fails (mismatched user_id in url vs in session dict)")
        response: TestResponse = self.client.delete("/api/delete-user/2")
        self.assertEqual(response.json["message"], "Failure: User selected for deletion cannot be found in the database.")
        
        #Create new user
        username2 = "test2"
        data = {"username":username2, "password1":pwd, "password2":pwd} 
        signup_response: TestResponse = self.client.post("/api/sign-up", json=data)

        print("         Test invalid input - deleting someone else's account fails (mismatched user_id in url vs in session dict)")
        response: TestResponse = self.client.delete("/api/delete-user/2")
        self.assertEqual(response.json["message"], "Failure: Account chosen for deletion does not match the account logged in.")

        print("         Testing valid input - deleting an account when logged in")
        response: TestResponse = self.client.delete("/api/delete-user/1")
        self.assertEqual(response.status_code, 200)
        
        print("     Test that all user's content (rts, projects, objectives and tasks) was deleted")
        with app.app_context():
            user = User.query.filter_by(id=1).first()
            refresh_token = Refresh_Token.query.filter_by(user_id=1).first()
            projects = Project.query.filter_by(user_id=1).all()
            self.assertEqual(user, None)
            self.assertEqual(refresh_token, None)
            self.assertEqual(len(projects), 0) #if no projects then no objectives or tasks

    def test6_get_user(self):
        print("     \n6)Testing get_user")
        admin_username, reg_username = "admin", "reg"
        pwd = "ttt"

        #test sign-up and login of reg account (logs into reg account )
        self.standard_login_and_auth_test(httpmethod="get", endpoint="/api/get-user/1", json_data=None, username=reg_username, pwd=pwd)

        #create admin account
        with app.app_context():
            admin_user: User = User(username=admin_username, password=generate_password_hash(pwd), is_admin=True)
            db.session.add(admin_user)
            db.session.commit()
 
        print("         Test accessing the route from reg account fails")
        response_get_user: TestResponse = self.client.get("/api/get-user/1")
        self.assertEqual(response_get_user.status_code, 403)
        
        #login to admin account
        login_response: TestResponse = self.client.post("/api/login", json = {"username":admin_username, "password":pwd})

        print("         Test successfully accessing the route as an admin")       
        response_get_user: TestResponse = self.client.get("/api/get-user/1")
        self.assertEqual(response_get_user.status_code, 200)
        
        print("         Test trying get an account that does not exist fails")       
        response_get_user: TestResponse = self.client.get("/api/get-user/3")
        self.assertEqual(response_get_user.json["message"], "Failure: the user you are trying to get does not exist")


    def test7_edit_user(self):
        print("     \n7)Testing edit-user")
        username, password, email = "test", "ttt" , "test@example.com"
        new_username, new_password, new_email = "test1", "ttt1", "new_email@example.com"

        self.standard_login_and_auth_test(httpmethod="patch", endpoint="/api/edit-user/1", json_data={"":""}, username=username, pwd=password, email=email)

        #Make user1 admin
        user = User(username=username, password=generate_password_hash(password, "pbkdf2"), email=email, is_admin=True)
        with app.app_context():
            user = User.query.filter_by(id=1).first()
            user.is_admin = True
            db.session.commit()

        #Other Test Cases:
        print("         Test invalid input - editing someone else's account fails (mismatched user_id in url vs in session dict)")
        response: TestResponse = self.client.patch("/api/edit-user/2")
        self.assertEqual(response.json["message"], "Failure: The account you are attempting to edit does not match the account that is logged in")
        
        print("         Testing valid input - editing your account when logged in works")
        response_get_user_old: TestResponse = self.client.get("/api/get-user/1")
        time.sleep(0.1)
        new_data = {"username":new_username, "password":password, "password1":new_password, "password2":new_password, "email":new_email }
        response: TestResponse = self.client.patch("/api/edit-user/1", json=new_data)
        self.assertEqual(response.json["message"], "Success: User was successfully edited")

        print("         Test successful login with new credentitals")
        response_login: TestResponse = self.client.post("/api/login", json= {"username":new_username, "password":new_password})
        self.assertEqual(response_login.status_code, 200)

        print("         Test verify the changes made to email and lastUpdated")
        response_get_user: TestResponse = self.client.get("/api/get-user/1")
        older_user_details = response_get_user_old.json["user"]
        new_user_details = response_get_user.json["user"]
        self.assertNotEqual(older_user_details["email"], new_user_details["email"])
        self.assertNotEqual(older_user_details["lastUpdated"], new_user_details["lastUpdated"])

    def test8_get_user_rts(self):
        print("     \n8)Test get_user_rts")
        admin_username, reg_username = "admin", "reg"
        pwd = "ttt"

        #test sign-up and login of reg account (logs into reg account )
        self.standard_login_and_auth_test(httpmethod="get", endpoint="/api/get-user-rts/1", json_data=None, username=reg_username, pwd=pwd)

        #create admin account
        with app.app_context():
            admin_user: User = User(username=admin_username, password=generate_password_hash(pwd), is_admin=True)
            db.session.add(admin_user)
            db.session.commit()

        print("         Test accessing route without admin rights fails")
        response: TestResponse = self.client.get("/api/get-user-rts/1")
        self.assertEqual(response.json["message"], "Failure: User is not permitted to access this route")
        
        print("         Test accessing route with admin rights succeeds")
        login_response: TestResponse = self.client.post("/api/login", json={"username":admin_username, "password":pwd})
        response: TestResponse = self.client.get("/api/get-user-rts/1")
        self.assertEqual(response.json["message"], "Success: retrieved user rt")

        print("         Test getting the rts of a user that does not exit fails")
        login_response2: TestResponse = self.client.post("/api/login", json={"username":admin_username, "password":pwd})
        response: TestResponse = self.client.get("/api/get-user-rts/3")
        self.assertEqual(response.json["message"], "Failure: the user you are trying to get does not exist")

if __name__ == "__main__":
    unittest.main()