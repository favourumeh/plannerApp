import unittest 
import os
from routes import auth
from config import app, serializer
from models import db, User, Refresh_Token
from datetime import datetime, timezone, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from plannerPackage import filter_dict, decrypt_bespoke_session_cookie


now = datetime.now()
print(f"\nTest time: {str(now.time()).split(".")[0]}. (date = {now.date()}) ------------------------")
class FlaskAPIAuthTestCase(unittest.TestCase):
    app.register_blueprint(auth)
    db.init_app(app=app)
    
    def setUp(self):
        #This is setUp class is executed before the 
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///:memory:" #use an in-memory database for tests
        
        self.client = app.test_client(use_cookies=True)
        
        with app.app_context():
            db.create_all()

    def tearDown(self):
        # clean up the database after each test
        with app.app_context():
            db.session.remove()
            db.drop_all()
        
    def test1_signup(self):
        print("     1)Testing test_signup")
        #Add a user entry to the user table of the in-memory db
        user = User(username="test", password="ttt", email="test@test.com")
        with app.app_context():
            db.session.add(user)
            db.session.commit()

        #Test cases:
        print("         Test Valid Input")
        data = {"username":"test1", "password1": "ttt", "password2": "ttt"} 
        response = self.client.post("/sign-up", json = data )
        self.assertEqual(response.json, {"message": "Success: Account Created! Login to start planning"})
        self.assertEqual(response.status_code, 201)

        print("         Test Valid Input w/email")
        data = {"username":"test2", "password1": "ttt", "password2": "ttt", "email": "example@exmaple.com"} 
        response = self.client.post("/sign-up", json = data )
        self.assertEqual(response.json, {"message": "Success: Account Created! Login to start planning"})
        self.assertEqual(response.status_code, 201)

        print("         Test invalid Input - existing user in db")
        data = {"username":"test", "password1": "ttt", "password2": "ttt"} 
        response = self.client.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Username is taken. Please choose another one."})
        self.assertEqual(response.status_code, 400)
        
        print("         Test invalid Input - username too long")
        data = {"username":"test"*4, "password1": "ttt1", "password2": "ttt"} 
        response = self.client.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Username is too long. Must be <= 15 characters."})
        self.assertEqual(response.status_code, 400)
               
        print("         Test invalid Input - existing email in db")
        data = {"username":"test4", "password1": "ttt", "password2": "ttt", "email": "test@test.com"} 
        response = self.client.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is taken. Please choose another one."})
        self.assertEqual(response.status_code, 400)
    
        print("         Test invalid Input - email too long")
        data = {"username":"test5", "password1": "ttt", "password2": "ttt", "email": "test@test.com"*10} 
        response = self.client.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is too long. Must be <= 120 characters."})
        self.assertEqual(response.status_code, 400)
        
        print("         Test invalid Input - password mismatch")
        data = {"username":"test6", "password1": "ttt1", "password2": "ttt"} 
        response = self.client.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Passwords do not match"})
        self.assertEqual(response.status_code, 400)

    def test2_login(self):
        print("     2)Testing login")
        #Add a user entry to the user table of the in-memory db
        user = User(username="test", password=generate_password_hash("ttt", "pbkdf2"), email="test@test.com")
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        
        print("         Test valid input - refresh token creation")
        data = {"username": "test", "password":"ttt"}
        response = self.client.post("/login", json = data)
        self.assertEqual(response.json["user"], {"id":1, "username": "test"})
        self.assertEqual(response.status_code, 200)

        print("         Test valid input -  refresh token renewal")
        now = datetime.now(tz=timezone.utc)                
        refresh_token_obj = Refresh_Token(token="aaa", exp = now - timedelta(days=1))
        with app.app_context():
            db.session.add(refresh_token_obj)
        data = {"username": "test", "password":"ttt"}
        response = self.client.post("/login", json = data)
        self.assertEqual(response.json["user"], {"id":1, "username": "test"})
        self.assertEqual(response.status_code, 200)

        print("         Test invalid input - user not found")
        data = {"username": "test1", "password":"ttt"}
        response = self.client.post("/login", json = data)
        self.assertEqual(response.status_code, 401)
               
        print("         Test invalid input - incorrect password")
        data = {"username": "test", "password":"ttt1"}
        response = self.client.post("/login", json = data)
        self.assertEqual(response.status_code, 401)
    
    def test3_logout(self):
        print("     3)Testing logout ")
        #create account
        username, pwd = "test","ttt"
        user: User = User(username=username, password=generate_password_hash(pwd))
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        
        #Test Cases 
        print("         Test accessing the route whilst not logged in fails - (c: no bespoke session cookie)")
        response = self.client.get("/logout")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")
        self.assertEqual(response.status_code, 400)

            #login 
        self.client.post("/login", json={"username":username, "password":pwd})
        print("         Test successful logout")
        response = self.client.get("/logout")
        self.assertEqual(response.status_code, 200)
        
        print("         Test accessing the route whilst not logged in fails - (c: no refresh token)")
        bsc = os.environ["expired_bespoke_session_cookie"]
        self.client.set_cookie(key="bespoke_session", value=bsc,httponly=True, samesite="None", secure=True)
        response = self.client.get("/logout")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no rt). Please log in.")
        self.assertEqual(response.status_code, 404)
    
    def test4_refresh(self):
        print("     4)Testing refresh ")
        #create account
        username, pwd = "test","ttt"
        user: User = User(username=username, password=generate_password_hash(pwd))
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        
        #import an expired bespoke session cookie
        bsc = os.environ["expired_bespoke_session_cookie"]

        #Test Cases 
        print("         Test accessing the route whilst not logged in fails - (c: no bespoke_session cookie)")
        response = self.client.get("/refresh")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")
        self.assertEqual(response.status_code, 400)
        
        print("         Test accessing the route whilst not logged in fails - (c: no refresh token)")
        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response = self.client.get("/refresh")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no rt). Please log in.")
        self.assertEqual(response.status_code, 404)       

        print("         Test accessing the route with an expired refresh token fails")
        exp: datetime = datetime.now(tz=timezone.utc) - timedelta(days =1)
        token_hash = generate_password_hash(decrypt_bespoke_session_cookie(bsc, serializer)["refreshToken"], method = "pbkdf2")
        refresh_token_obj: Refresh_Token = Refresh_Token(token=token_hash, exp=exp, user_id=1)  
        with app.app_context():
            db.session.add(refresh_token_obj)
            db.session.commit()
            
        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response = self.client.get("/refresh")
        self.assertEqual(response.json["message"], "Failure: Please login. Refresh token has expired.")
        
            #login
        self.client.post("/login", json={"username":username, "password":pwd})
        
        print("         Test successful request")
        response = self.client.get("/refresh")
        self.assertEqual(response.status_code, 200)

        print("         Test accessing the route with an invalid refresh token fails")
        self.client.set_cookie(key="bespoke_session", value=bsc, httponly=True, samesite="None", secure=True)
        response = self.client.get("/refresh")
        self.assertEqual(response.json["message"], "Failure: Refresh token is invalid. Please login")
        
    def test5_delete_user(self):
        print("     5)Testing delete_user")
        #Test Case: not logged in user
        print("         Test invalid input - account delete fails without session cookies (i.e. without login)")
        response = self.client.delete("/delete_user/1")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")
        self.assertEqual(response.status_code, 400)
        
        #Add a user entry to the user table of the in-memory db
        user = User(username="test", password=generate_password_hash("ttt", "pbkdf2"), email="test@test.com")
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        
        #login to user
        data = {"username": "test", "password":"ttt"}
        self.client.post("/login", json = data)

        #Other Test Cases:
        print("         Test invalid input - deleting someone else's account fails (mismatched user_id in url vs in session dict)")
        response = self.client.delete("/delete_user/2")
        self.assertEqual(response.json["message"], "Failure: Account chosen for deletion does not match the account logged in.")
        self.assertEqual(response.status_code, 403)
        
            #valid deletion of an account
        print("         Testing valid input - deleting an account when logged in")
        response = self.client.delete("/delete_user/1")
        self.assertEqual(response.json["message"], "Deleted account (test) and associated access and refresh token.")
        self.assertEqual(response.status_code, 200)

    def test6_edit_user(self):
        print("     6)Testing edit_user")
        username, password, email = "test", "ttt" , "test@example.com"
        new_username, new_password, new_email = "test1", "ttt1", "new_email@example.com"
        
        #Test Case: not logged in user
        print("         Test invalid input - account edit fails without session cookies (i.e. without login)")
        response = self.client.patch("/edit_user/1")
        self.assertEqual(response.json["message"], "Failure: User is not logged in (no b_sc). Please login!")
        self.assertEqual(response.status_code, 400)
        
        #Add a user entry to the user table of the in-memory db
        user = User(username=username, password=generate_password_hash(password, "pbkdf2"), email=email, is_admin=True)
        with app.app_context():
            db.session.add(user)
            db.session.commit()
        
        #login to user
        data = {"username": username, "password": password}
        self.client.post("/login", json = data)

        #Other Test Cases:
        print("         Test invalid input - editing someone else's account fails (mismatched user_id in url vs in session dict)")
        response = self.client.patch("/edit_user/2")
        self.assertEqual(response.json["message"], "Failure: The account you are attempting to edit does not match the account that is logged in")
        self.assertEqual(response.status_code, 403)
        
        print("         Testing valid input - editing your account when logged in works")
        response_get_user_old = self.client.get("/get-user/1")
        new_data = {"username":new_username, "password":password, "password1":new_password, "password2":new_password, "email":new_email }
        response = self.client.patch("/edit_user/1", json=new_data)
        self.assertEqual(response.json["message"], "Success: User was successfully edited")
        
        print("         Test successful login with new credentitals")
        response_login = self.client.post("/login", json= {"username":new_username, "password":new_password})
        self.assertEqual(response_login.status_code, 200)
        
        print("         Test verify the changes made to email and lastUpdated")
        response_get_user = self.client.get("/get-user/1")
        older_user_details = response_get_user_old.json["user"]
        new_user_details = response_get_user.json["user"]
        self.assertNotEqual(older_user_details["email"], new_user_details["email"])
        self.assertNotEqual(older_user_details["lastUpdated"], new_user_details["lastUpdated"])

        # self.assertTrue()

    def test7_get_user(self):
        print("     7)Testing get_user")
        
        #Test Cases:
        print("         Test accessing the route without session cokies fails")
        response_get_user = self.client.get("/get-user/1")
        self.assertEqual(response_get_user.status_code, 400)
        self.assertEqual(response_get_user.json["message"],"Failure: User is not logged in (no b_sc). Please login!")
        
        #creating test user entries
        admin_username, reg_username = "admin", "reg"
        pwd = "ttt"
        admin_user: User = User(username=admin_username, password=generate_password_hash(pwd), is_admin=True) 
        reg_user: User = User(username=reg_username, password=generate_password_hash(pwd), is_admin=False) 
        with app.app_context():
            db.session.add(admin_user)
            db.session.add(reg_user)
            db.session.commit()

            #login to reg account
        self.client.post("/login", json = {"username":reg_username, "password":pwd})
 
        print("         Test accessing the route from reg account fails")
        response_get_user = self.client.get("/get-user/2")
        self.assertEqual(response_get_user.status_code, 403)
        
        #login to admin account
        self.client.post("/login", json = {"username":admin_username, "password":pwd})

        print("         Test successfully accessing the route as an admin")       
        response_get_user = self.client.get("/get-user/1")
        self.assertEqual(response_get_user.status_code, 200)
        
        print("         Test trying get an account that does not exist fails")       
        response_get_user = self.client.get("/get-user/3")
        self.assertEqual(response_get_user.json["message"], "Failure: the user you are trying to get does not exist")
        self.assertEqual(response_get_user.status_code, 404)

        print("         Test accessing the route with a missing access token cookie fails")
        self.client.set_cookie(key="session_AT", value="",httponly=True, samesite="None", secure=True)
        response_get_user = self.client.get("/get-user/1")
        self.assertEqual(response_get_user.json["message"], "Request is missing access token. Please login to refresh access token")
        self.assertEqual(response_get_user.status_code, 400)
        
        print("         Test accessing the route with an invalid access token cookie fails")
        self.client.set_cookie(key="session_AT", value="sdfasdf",httponly=True, samesite="None", secure=True)
        response_get_user = self.client.get("/get-user/1")
        self.assertEqual(response_get_user.json["message"].split("! Reason:")[0], "Deserialisation or Signiture verificaiton of access token cookie has failed" )
        self.assertEqual(response_get_user.status_code, 400)
        
        print("         Test accessing the route with an expired access token cookie fails")
        self.client.set_cookie(key="session_AT", value= os.environ["expired_access_token_cookie"],httponly=True, samesite="None", secure=True)
        response_get_user = self.client.get("/get-user/1")
        self.assertEqual(response_get_user.json["message"], "Invalid Access Token! Reason: Signature has expired" )
        self.assertEqual(response_get_user.status_code, 401)
        

if __name__ == "__main__":
    unittest.main()