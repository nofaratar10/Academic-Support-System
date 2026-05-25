from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import date
from process3 import init_process3
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

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
    # tasks relationship is added dynamically by process3.init_process3()

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


class Task(db.Model):
    __tablename__ = "tasks"

    task_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
    task = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.String(50), nullable=True)
    status = db.Column(db.String(50), nullable=False, default="פתוח")

    def to_dict(self):
        return {
            "task_id": self.task_id,
            "student_id": self.student_id,
            "task": self.task,
            "description": self.description or "",
            "dueDate": self.due_date or "",
            "status": self.status
        }


class Ticket(db.Model):
    __tablename__ = "tickets"

    ticket_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=True)
    sender_name = db.Column(db.String(100), nullable=True, default="פולינה (רכזת)")
    recipient = db.Column(db.String(100), nullable=False)
    cc = db.Column(db.String(100), nullable=True)
    subject = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="חדש")
    direction = db.Column(db.String(20), nullable=True, default="incoming")
    created_at = db.Column(db.Date, nullable=False, default=date.today)

    student = db.relationship("Student", backref="tickets", lazy=True)
    messages = db.relationship("TicketMessage", backref="ticket", lazy=True, order_by="TicketMessage.created_at")

    def to_dict(self):
        student_name = ""
        if self.student:
            student_name = f"{self.student.first_name} {self.student.last_name}".strip()
        return {
            "ticket_id": self.ticket_id,
            "student_id": self.student_id,
            "student_name": student_name or self.recipient,
            "sender_name": self.sender_name or "פולינה (רכזת)",
            "recipient": self.recipient,
            "cc": self.cc,
            "subject": self.subject,
            "content": self.content,
            "status": self.status,
            "direction": self.direction or "incoming",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class TicketMessage(db.Model):
    __tablename__ = "ticket_messages"

    message_id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.ticket_id"), nullable=False)
    sender = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())

    def to_dict(self):
        return {
            "message_id": self.message_id,
            "ticket_id": self.ticket_id,
            "sender": self.sender,
            "content": self.content,
            "created_at": self.created_at.strftime("%d/%m/%y | %H:%M") if self.created_at else None
        }


# ─── Static routes ───────────────────────────────────────────
init_process3(app, db, Student, Task)
@app.route("/")
def home():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "student-cases.html")

@app.route("/student-cases")
def student_cases():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "student-cases.html")

@app.route("/student-details")
def student_details():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "student-details.html")

@app.route("/case-documents")
def case_documents():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "case-documents.html")

@app.route("/case-plan")
def case_plan():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "case-plan.html")

@app.route("/student-summary")
def student_summary():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "student-summary.html")

@app.route("/new-case")
def new_case():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "new-case.html")

@app.route("/dashboard")
def dashboard():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "dashboard.html")

@app.route("/tickets")
def tickets():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "tickets.html")

@app.route("/new-ticket")
def new_ticket():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "new-ticket.html")

@app.route("/view-ticket")
def view_ticket():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "view-ticket.html")

@app.route("/alerts")
def alerts():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "alerts.html")

@app.route("/progress")
def progress():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "progress.html")

@app.route("/reports")
def reports():
    return send_from_directory(os.path.join(BASE_DIR, "html"), "reports.html")

@app.route('/CSS/<path:filename>')
def css_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, "CSS"), filename)

@app.route('/JS/<path:filename>')
def js_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, "js"), filename)

@app.route('/HTML/<path:filename>')
def html_files(filename):
    return send_from_directory(os.path.join(BASE_DIR, "html"), filename)


# ─── Students API ───────────────────────────────────────────

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


# ─── Tasks API ───────────────────────────────────────────────

@app.route("/students/<int:student_id>/tasks", methods=["GET"])
def get_tasks(student_id):
    Student.query.get_or_404(student_id)
    tasks = Task.query.filter_by(student_id=student_id).all()
    return jsonify([t.to_dict() for t in tasks])

@app.route("/students/<int:student_id>/tasks", methods=["POST"])
def create_task(student_id):
    Student.query.get_or_404(student_id)
    data = request.get_json()
    if not data or not data.get("task"):
        return jsonify({"error": "task name is required"}), 400

    task = Task(
        student_id=student_id,
        task=data.get("task"),
        description=data.get("description", ""),
        due_date=data.get("dueDate", ""),
        status=data.get("status", "פתוח")
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


# ─── Tickets API ─────────────────────────────────────────────

@app.route("/api/tickets", methods=["GET"])
def get_tickets():
    all_tickets = Ticket.query.order_by(Ticket.ticket_id.desc()).all()
    return jsonify([ticket.to_dict() for ticket in all_tickets])

@app.route("/api/tickets", methods=["POST"])
def create_ticket():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400
    if not data.get("recipient") or not data.get("subject") or not data.get("content"):
        return jsonify({"error": "recipient, subject and content are required"}), 400

    ticket = Ticket(
        student_id=data.get("student_id"),
        sender_name=data.get("sender_name", "פולינה (רכזת)"),
        recipient=data.get("recipient"),
        cc=data.get("cc"),
        subject=data.get("subject"),
        content=data.get("content"),
        status=data.get("status", "חדש"),
        direction=data.get("direction", "outgoing")
    )
    db.session.add(ticket)
    db.session.flush()

    first_message = TicketMessage(
        ticket_id=ticket.ticket_id,
        sender=data.get("sender_name", "פולינה (רכזת)"),
        content=data.get("content")
    )
    db.session.add(first_message)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201

@app.route("/api/tickets/<int:ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    return jsonify(ticket.to_dict())

@app.route("/api/tickets/<int:ticket_id>/messages", methods=["GET"])
def get_ticket_messages(ticket_id):
    Ticket.query.get_or_404(ticket_id)
    messages = TicketMessage.query.filter_by(ticket_id=ticket_id).order_by(TicketMessage.created_at).all()
    return jsonify([m.to_dict() for m in messages])

@app.route("/api/tickets/<int:ticket_id>/messages", methods=["POST"])
def add_ticket_message(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json()
    if not data or not data.get("content"):
        return jsonify({"error": "content is required"}), 400

    message = TicketMessage(
        ticket_id=ticket_id,
        sender=data.get("sender", "פולינה (רכזת)"),
        content=data.get("content")
    )
    if ticket.status == "חדש":
        ticket.status = "בטיפול"

    db.session.add(message)
    db.session.commit()
    return jsonify(message.to_dict()), 201


# ─── Seed ────────────────────────────────────────────────────

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


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)