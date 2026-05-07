import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import date
from dotenv import load_dotenv  
import google.generativeai as genai  

load_dotenv()

app = Flask(__name__)
CORS(app)

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_KEY)

app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://livu_user:12345678@localhost/livu_db"
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
            "task_status": "הושלם",
            "track": "מערכות מידע",
            "semester": "סמסטר א"
        }


class SupportFile(db.Model):
    __tablename__ = "support_files"

    case_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    open_date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.String(50), nullable=False, default="Open")
    urgency_level = db.Column(db.String(50), nullable=True)
    summary = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "case_id": self.case_id,
            "student_id": self.student_id,
            "open_date": self.open_date.isoformat() if self.open_date else None,
            "status": self.status,
            "urgency_level": self.urgency_level,
            "summary": self.summary,
        }


@app.route("/")
def home():
    return jsonify({"message": "Student Support System API is running"})


@app.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    return jsonify([student.to_dict() for student in students])


@app.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict())


@app.route("/students", methods=["POST"])
def create_student():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    if not data.get("first_name") or not data.get("last_name"):
        return jsonify({"error": "first_name and last_name are required"}), 400

    student = Student(
        first_name=data["first_name"],
        last_name=data["last_name"],
        academic_year=data.get("academic_year"),
        email=data.get("email"),
        phone=data.get("phone"),
    )

    db.session.add(student)
    db.session.commit()

    return jsonify(student.to_dict()), 201


@app.route("/seed-students", methods=["GET"])
def seed_students():
    if Student.query.count() > 0:
        return jsonify({"message": "students already exist"})

    students = [
        Student(first_name="יוסי", last_name="כהן", academic_year="שנה ב", email="yossi@example.com", phone="050-1234567"),
        Student(first_name="תומר", last_name="כהן", academic_year="שנה א", email="tomer@example.com", phone="050-7654321"),
        Student(first_name="שירה", last_name="כהן", academic_year="שנה ג", email="shira@example.com", phone="050-1111111"),
        Student(first_name="דנה", last_name="לוי", academic_year="שנה ב", email="dana@example.com", phone="050-2222222"),
        Student(first_name="מאיה", last_name="מזרחי", academic_year="שנה א", email="maya@example.com", phone="050-3333333"),
        Student(first_name="רועי", last_name="אזולאי", academic_year="שנה ג", email="roee@example.com", phone="050-4444444"),
        Student(first_name="רוני", last_name="בן דוד", academic_year="שנה ב", email="roni@example.com", phone="050-5555555"),
        Student(first_name="איתי", last_name="אברהם", academic_year="שנה א", email="itay@example.com", phone="050-6666666"),
        Student(first_name="דניאל", last_name="ביטון", academic_year="שנה ג", email="daniel@example.com", phone="050-7777777"),
    ]

    db.session.add_all(students)
    db.session.commit()

    support_files = [
        SupportFile(student_id=1, status="Open"),
        SupportFile(student_id=2, status="Open"),
        SupportFile(student_id=3, status="Closed"),
        SupportFile(student_id=4, status="Pending"),
        SupportFile(student_id=5, status="Open"),
        SupportFile(student_id=6, status="Open"),
        SupportFile(student_id=7, status="Open"),
        SupportFile(student_id=8, status="Open"),
        SupportFile(student_id=9, status="Open"),
    ]

    db.session.add_all(support_files)
    db.session.commit()

    return jsonify({"message": "demo students seeded successfully"})

@app.route("/summarize", methods=["POST"])
def summarize_text():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    original_text = data["text"]

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""סכם את השיחה בפורמט הבא בדיוק:
        סיכום: ...
        נקודות: 
        * ...
        משימות:
        * ...

        השיחה: {original_text}"""

        response = model.generate_content(prompt)
        return jsonify({"summary_result": response.text})

    except Exception as e:
        print(f"Error with Gemini: {e}")
        return jsonify({"error": "Failed to generate summary"}), 500


if __name__ == "__main__":
    with app.app_context():
      db.create_all()
    app.run(debug=True)