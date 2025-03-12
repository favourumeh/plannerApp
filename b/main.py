from config import app, db
from routes import auth, project, objective, task

#create db
with app.app_context():
    db.create_all()
    
#register blueprints
app.register_blueprint(auth)
app.register_blueprint(project)
app.register_blueprint(objective)
app.register_blueprint(task)

if __name__=="__main__":
    app.run(debug=True)