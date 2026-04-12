from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from datetime import date

app = Flask(__name__)

# SQLite file that will be created inside the project folder
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///student_support.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# =========================
# Models / Tables
# =========================

class Student(db.Model):
    __tablename__ = "students"

    student_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    academic_year = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True, unique=True)
    phone = db.Column(db.String(20), nullable=True)

    support_files = db.relationship("SupportFile", backref="student", lazy=True)
    requests = db.relationship("Request", backref="student", lazy=True)
    military_services = db.relationship("MilitaryService", backref="student", lazy=True)

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "academic_year": self.academic_year,
            "email": self.email,
            "phone": self.phone,
        }


class StaffMember(db.Model):
    __tablename__ = "staff_members"

    staff_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(100), nullable=True)

    tasks = db.relationship("Task", backref="assigned_staff", lazy=True)
    handled_requests = db.relationship("Request", backref="handled_by_staff", lazy=True)

    def to_dict(self):
        return {
            "staff_id": self.staff_id,
            "name": self.name,
            "role": self.role,
            "department": self.department,
        }


class SupportFile(db.Model):
    __tablename__ = "support_files"

    case_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    open_date = db.Column(db.Date, nullable=False, default=date.today)
    status = db.Column(db.String(50), nullable=False, default="Open")
    urgency_level = db.Column(db.String(50), nullable=True)
    summary = db.Column(db.Text, nullable=True)

    tasks = db.relationship("Task", backref="support_file", lazy=True)
    requests = db.relationship("Request", backref="support_file", lazy=True)

    def to_dict(self):
        return {
            "case_id": self.case_id,
            "student_id": self.student_id,
            "open_date": self.open_date.isoformat() if self.open_date else None,
            "status": self.status,
            "urgency_level": self.urgency_level,
            "summary": self.summary,
        }


class Request(db.Model):
    __tablename__ = "requests"

    request_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    case_id = db.Column(db.Integer, db.ForeignKey("support_files.case_id"), nullable=True)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="New")
    created_at = db.Column(db.Date, nullable=False, default=date.today)
    handled_by_staff_id = db.Column(db.Integer, db.ForeignKey("staff_members.staff_id"), nullable=True)

    def to_dict(self):
        return {
            "request_id": self.request_id,
            "student_id": self.student_id,
            "case_id": self.case_id,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "handled_by_staff_id": self.handled_by_staff_id,
        }


class Task(db.Model):
    __tablename__ = "tasks"

    task_id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("support_files.case_id"), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="Pending")
    due_date = db.Column(db.Date, nullable=True)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey("staff_members.staff_id"), nullable=True)

    def to_dict(self):
        return {
            "task_id": self.task_id,
            "case_id": self.case_id,
            "description": self.description,
            "status": self.status,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "assigned_staff_id": self.assigned_staff_id,
        }


class MilitaryService(db.Model):
    __tablename__ = "military_service"

    service_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="Active")

    def to_dict(self):
        return {
            "service_id": self.service_id,
            "student_id": self.student_id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status,
        }


# =========================
# Helper
# =========================

def parse_date(value):
    if not value:
        return None
    return date.fromisoformat(value)


# =========================
# Routes
# =========================

@app.route("/")
def home():
    return jsonify({"message": "Student Support System API is running"})


# ----- Students -----

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


@app.route("/students", methods=["GET"])
def get_students():
    students = Student.query.all()
    return jsonify([student.to_dict() for student in students])


@app.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    student = Student.query.get_or_404(student_id)
    return jsonify(student.to_dict())


# ----- Staff -----

@app.route("/staff", methods=["POST"])
def create_staff():
    data = request.get_json()

    if not data or not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    staff = StaffMember(
        name=data["name"],
        role=data.get("role"),
        department=data.get("department"),
    )

    db.session.add(staff)
    db.session.commit()

    return jsonify(staff.to_dict()), 201


@app.route("/staff", methods=["GET"])
def get_staff():
    staff_members = StaffMember.query.all()
    return jsonify([staff.to_dict() for staff in staff_members])


# ----- Support Files -----

@app.route("/support-files", methods=["POST"])
def create_support_file():
    data = request.get_json()

    if not data or not data.get("student_id"):
        return jsonify({"error": "student_id is required"}), 400

    student = Student.query.get(data["student_id"])
    if not student:
        return jsonify({"error": "Student not found"}), 404

    support_file = SupportFile(
        student_id=data["student_id"],
        open_date=parse_date(data.get("open_date")) or date.today(),
        status=data.get("status", "Open"),
        urgency_level=data.get("urgency_level"),
        summary=data.get("summary"),
    )

    db.session.add(support_file)
    db.session.commit()

    return jsonify(support_file.to_dict()), 201


@app.route("/support-files", methods=["GET"])
def get_support_files():
    support_files = SupportFile.query.all()
    return jsonify([support_file.to_dict() for support_file in support_files])


# ----- Requests -----

@app.route("/requests", methods=["POST"])
def create_request_record():
    data = request.get_json()

    if not data or not data.get("student_id") or not data.get("description"):
        return jsonify({"error": "student_id and description are required"}), 400

    student = Student.query.get(data["student_id"])
    if not student:
        return jsonify({"error": "Student not found"}), 404

    if data.get("case_id"):
        support_file = SupportFile.query.get(data["case_id"])
        if not support_file:
            return jsonify({"error": "Support file not found"}), 404

    if data.get("handled_by_staff_id"):
        staff = StaffMember.query.get(data["handled_by_staff_id"])
        if not staff:
            return jsonify({"error": "Staff member not found"}), 404

    request_record = Request(
        student_id=data["student_id"],
        case_id=data.get("case_id"),
        description=data["description"],
        status=data.get("status", "New"),
        created_at=parse_date(data.get("created_at")) or date.today(),
        handled_by_staff_id=data.get("handled_by_staff_id"),
    )

    db.session.add(request_record)
    db.session.commit()

    return jsonify(request_record.to_dict()), 201


@app.route("/requests", methods=["GET"])
def get_requests():
    requests_list = Request.query.all()
    return jsonify([request_record.to_dict() for request_record in requests_list])


# ----- Tasks -----

@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json()

    if not data or not data.get("case_id") or not data.get("description"):
        return jsonify({"error": "case_id and description are required"}), 400

    support_file = SupportFile.query.get(data["case_id"])
    if not support_file:
        return jsonify({"error": "Support file not found"}), 404

    if data.get("assigned_staff_id"):
        staff = StaffMember.query.get(data["assigned_staff_id"])
        if not staff:
            return jsonify({"error": "Staff member not found"}), 404

    task = Task(
        case_id=data["case_id"],
        description=data["description"],
        status=data.get("status", "Pending"),
        due_date=parse_date(data.get("due_date")),
        assigned_staff_id=data.get("assigned_staff_id"),
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201


@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.to_dict() for task in tasks])


# ----- Military Service -----

@app.route("/military-service", methods=["POST"])
def create_military_service():
    data = request.get_json()

    if not data or not data.get("student_id") or not data.get("start_date"):
        return jsonify({"error": "student_id and start_date are required"}), 400

    student = Student.query.get(data["student_id"])
    if not student:
        return jsonify({"error": "Student not found"}), 404

    service = MilitaryService(
        student_id=data["student_id"],
        start_date=parse_date(data["start_date"]),
        end_date=parse_date(data.get("end_date")),
        status=data.get("status", "Active"),
    )

    db.session.add(service)
    db.session.commit()

    return jsonify(service.to_dict()), 201


@app.route("/military-service", methods=["GET"])
def get_military_services():
    services = MilitaryService.query.all()
    return jsonify([service.to_dict() for service in services])


# =========================
# Run and create tables
# =========================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)