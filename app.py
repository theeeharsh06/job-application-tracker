from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# Database configuration
db_path = os.path.join(os.path.dirname(__file__), 'job_tracker.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Job Application Model
class JobApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(100), nullable=False)
    position = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='Applied')
    date_applied = db.Column(db.DateTime, default=datetime.utcnow)
    platform = db.Column(db.String(100))
    link = db.Column(db.String(255))
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'company': self.company,
            'position': self.position,
            'status': self.status,
            'date_applied': self.date_applied.strftime('%Y-%m-%d'),
            'platform': self.platform,
            'link': self.link,
            'notes': self.notes
        }

# Initialize database
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/applications', methods=['GET'])
def get_applications():
    apps = JobApplication.query.order_by(JobApplication.date_applied.desc()).all()
    return jsonify([app.to_dict() for app in apps])

@app.route('/api/applications', methods=['POST'])
def add_application():
    data = request.json
    new_app = JobApplication(
        company=data.get('company'),
        position=data.get('position'),
        status=data.get('status', 'Applied'),
        platform=data.get('platform'),
        link=data.get('link'),
        notes=data.get('notes')
    )
    db.session.add(new_app)
    db.session.commit()
    return jsonify(new_app.to_dict()), 201

@app.route('/api/applications/<int:id>', methods=['DELETE'])
def delete_application(id):
    app_to_delete = JobApplication.query.get_or_404(id)
    db.session.delete(app_to_delete)
    db.session.commit()
    return '', 204

@app.route('/api/applications/<int:id>', methods=['PUT'])
def update_application(id):
    app_to_update = JobApplication.query.get_or_404(id)
    data = request.json
    app_to_update.status = data.get('status', app_to_update.status)
    app_to_update.company = data.get('company', app_to_update.company)
    app_to_update.position = data.get('position', app_to_update.position)
    app_to_update.platform = data.get('platform', app_to_update.platform)
    app_to_update.link = data.get('link', app_to_update.link)
    app_to_update.notes = data.get('notes', app_to_update.notes)
    
    db.session.commit()
    return jsonify(app_to_update.to_dict())

if __name__ == '__main__':
    app.run(debug=True)
