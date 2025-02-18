from config import app, db
from routes import auth

#create db
with app.app_context():
    db.create_all()
    
#register blueprints
app.register_blueprint(auth)

if __name__=="__main__":
    app.run(debug=True)