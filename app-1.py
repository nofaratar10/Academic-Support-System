add new HTML CSS JS files
03a5cca
python\app-1.py
@@ -0,0 +1,153 @@
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import date

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///student_support.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Student(db.Model):
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    academic_year = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True, unique=True)
    phone = db.Column(db.String(20), nullable=True)

    support_files = db.relationship("SupportFile", backref="student", lazy=True)

    def to_dict(self):
        latest_support_file = None
        if self.support_files:
            latest_support_file = sorted(
                self.support_files,
                key=lambda sf: sf.case_id,
                reverse=True
            )[0]

        return {
            "student_id": self.student_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "academic_year": self.academic_year,
            "email": self.email,
            "phone": self.phone,
            "support_status": latest_support_file.status if latest_support_file else "Open",