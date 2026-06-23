from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)
CORS(app) # Frontend theke request allow korar jonno

# MySQL Database Connection URL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/daily_task_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(50), default='Medium')
    due_date = db.Column(db.String(50), nullable=True)
    category = db.Column(db.String(100), default='Personal')
    completed = db.Column(db.Boolean, default=False)
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id, 
            "title": self.title, 
            "description": self.description,
            "priority": self.priority,
            "dueDate": self.due_date,
            "category": self.category,
            "completed": self.completed,
            "orderIndex": self.order_index
        }

# Invitation Table structure toyri kora 
class Invitation(db.Model):
    __tablename__ = 'invitations'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(50), default='Member')
    status = db.Column(db.Enum('pending', 'accepted'), default='pending')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# API Route: Database-e notun task add kora
@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    if not data or 'title' not in data:
        return jsonify({"error": "Title is required"}), 400
        
    new_task = Task(
        title=data.get('title'),
        description=data.get('description', ''),
        priority=data.get('priority', 'Medium'),
        due_date=data.get('dueDate', ''),
        category=data.get('category', 'Personal')
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify({"message": "Task added successfully", "task": new_task.to_dict()}), 201

# API Route: Database theke shob task get kora
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.to_dict() for task in tasks]), 200


@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
        
    data = request.get_json()
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'priority' in data:
        task.priority = data['priority']
    if 'dueDate' in data:
        task.due_date = data['dueDate']
    if 'category' in data:
        task.category = data['category']
    if 'status' in data:
        task.completed = (data['status'] == 'Completed')
    if 'orderIndex' in data:
        task.order_index = data['orderIndex']
        
    db.session.commit()
    return jsonify({"message": "Task updated successfully", "task": task.to_dict()}), 200

# API Route: Task Delete kora
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted successfully"}), 200

# 1. API Route: Create Invite and Send Email
@app.route('/api/create-invite', methods=['POST'])
def create_invite():
    data = request.get_json()
    email = data.get('email')
    role = data.get('role', 'Member')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Generate a unique token
    token = str(uuid.uuid4())

    # Save to database using SQLAlchemy
    try:
        new_invite = Invitation(email=email, token=token, role=role)
        db.session.add(new_invite)
        db.session.commit()
    except Exception as e:
        print("Database Error:", e)
        return jsonify({"error": "Database error"}), 500
    
    # Email configuration (cPanel SMTP)
    smtp_host = "arbsofttech.com"
    smtp_port = 465 
    sender_email = "dailytask@arbsofttech.com" 
    sender_password = "!@arbayaan0055!@" 
    
    invite_link = f"http://arbsofttech.com/signup?token={token}" 

    msg = MIMEMultipart()
    msg['From'] = f"Daily Task Workspace <{sender_email}>"
    msg['To'] = email
    msg['Subject'] = "Invitation to Join Daily Task Workspace"

    body = f"""Hello,

You have been invited to join the Daily Task Workspace as a {role}.

Please click the link below to accept the invitation and create your account:
{invite_link}

Best Regards,
Daily Task Team"""
    
    msg.attach(MIMEText(body, 'plain'))

    try:
        
        import smtplib
        server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return jsonify({"message": "Invitation sent successfully!"}), 200
    except Exception as e:
        print("Email Error:", e)
        return jsonify({"error": "Failed to send email"}), 500

#     # Email configuration
#     sender_email = "anisur.ayaan@gmail.com" 
#     app_password ="ybacnmqzrfyeytap"
    
#     # Ei link e click korle user app e jabe
#     invite_link = f"http://localhost:3000/?token={token}"

#     msg = MIMEMultipart()
#     msg['From'] = sender_email
#     msg['To'] = email
#     msg['Subject'] = "Invitation to Join Daily Task Workspace"

#     body = f"""Hello,

# You have been invited to join the Daily Task Workspace as a {role}.

# Please click the link below to accept the invitation and create your account:
# {invite_link}

# Best Regards,
# Daily Task Team"""
    
#     msg.attach(MIMEText(body, 'plain'))

#     try:
#         server = smtplib.SMTP('smtp.gmail.com', 587)
#         server.starttls()
#         server.login(sender_email, app_password)
#         server.send_message(msg)
#         server.quit()
#         return jsonify({"message": "Invitation sent successfully!"}), 200
#     except Exception as e:
#         print("Email Error:", e)
#         return jsonify({"error": "Failed to send email"}), 500


# 2. API Route: Verify Token
@app.route('/api/verify-invite/<token>', methods=['GET'])
def verify_invite(token):
    # Verify using SQLAlchemy
    invite = Invitation.query.filter_by(token=token, status='pending').first()

    if invite:
        return jsonify({"valid": True, "email": invite.email, "role": invite.role}), 200
    return jsonify({"valid": False}), 404

if __name__ == '__main__':
    # Python context-er moddhe automatic table create kora
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)