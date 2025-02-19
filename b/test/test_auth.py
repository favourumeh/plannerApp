import unittest 
from routes import auth
from config import app
from models import db, User
from datetime import datetime

now = datetime.now()
print(f"\nTest time: {str(now.time()).split(".")[0]}. (date = {now.date()}) ------------------------")
class FlaskAPIAuthTestCase(unittest.TestCase):
    
    def setUp(self):
        #This is setUp class is executed before the 
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///:memory:" #use an in-memory database for tests
        
        #register blueprints
        app.register_blueprint(auth)

        self.app = app.test_client()
        db.init_app(app=app)
        
        with app.app_context():
            db.create_all()

    def tearDown(self):
        # clean up the database after each test
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_signup(self):
        print("     1)Testing test_signup")
        #Add a user entry to the user table of the in-memory db
        user = User(username="test", password="ttt", email="test@test.com")
        with app.app_context():
            db.session.add(user)
            db.session.commit()

        #Edge cases:
        print("         Test Valid Input")
        data = {"username":"test1", "password1": "ttt", "password2": "ttt"} 
        response = self.app.post("/sign-up", json = data )
        self.assertEqual(response.json, {"message": "Success: Account Created! Login to start planning"})
        self.assertEqual(response.status_code, 201)

        print("         Test Valid Input w/email")
        data = {"username":"test2", "password1": "ttt", "password2": "ttt", "email": "example@exmaple.com"} 
        response = self.app.post("/sign-up", json = data )
        self.assertEqual(response.json, {"message": "Success: Account Created! Login to start planning"})
        self.assertEqual(response.status_code, 201)

        print("         Test invalid Input - existing user in db")
        data = {"username":"test", "password1": "ttt", "password2": "ttt"} 
        response = self.app.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Username is taken. Please choose another one."})
        self.assertEqual(response.status_code, 400)
        
        print("         Test invalid Input - username too long")
        data = {"username":"test"*4, "password1": "ttt1", "password2": "ttt"} 
        response = self.app.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Username is too long. Must be <= 15 characters."})
        self.assertEqual(response.status_code, 400)
               
        print("         Test invalid Input - existing email in db")
        data = {"username":"test4", "password1": "ttt", "password2": "ttt", "email": "test@test.com"} 
        response = self.app.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is taken. Please choose another one."})
        self.assertEqual(response.status_code, 400)
    
        print("         Test invalid Input - email too long")
        data = {"username":"test5", "password1": "ttt", "password2": "ttt", "email": "test@test.com"*10} 
        response = self.app.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Email is too long. Must be <= 120 characters."})
        self.assertEqual(response.status_code, 400)
        
        print("         Test invalid Input - password mismatch")
        data = {"username":"test6", "password1": "ttt1", "password2": "ttt"} 
        response = self.app.post("/sign-up", json = data)
        self.assertEqual(response.json, {"message": "Failure: Passwords do not match"})
        self.assertEqual(response.status_code, 400)

       
            
if __name__ == "__main__":
    unittest.main()