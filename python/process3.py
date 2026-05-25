"""
Process 3 – Progress Management and Gamification
=================================================
Defines the Task SQLAlchemy model and all related API routes.

Usage (called once from app-1.py after db and Student are defined):
    from process3 import init_process3
    Task = init_process3(app, db, Student)
"""

from flask import jsonify
from datetime import date, datetime, timedelta


def init_process3(app, db, Student):
    """
    Register the Task model and Process 3 routes with the main Flask app.
    Must be called after `db` and `Student` are defined, before db.create_all().
    Returns the Task class so app-1.py can reference it if needed.
    """

    # ── Task model ──────────────────────────────────────────────────────────────
    class Task(db.Model):
        __tablename__ = "tasks"

        id          = db.Column(db.Integer, primary_key=True)
        student_id  = db.Column(db.Integer, db.ForeignKey("students.student_id"), nullable=False)
        title       = db.Column(db.String(200), nullable=False)
        description = db.Column(db.Text, nullable=True)
        # 'open' or 'completed' — overdue is derived at query time by comparing due_date with today
        status      = db.Column(db.String(50), nullable=False, default="open")
        due_date    = db.Column(db.Date, nullable=True)
        completed_at = db.Column(db.DateTime, nullable=True)
        points      = db.Column(db.Integer, nullable=False, default=10)

    # Give the Student model a .tasks back-reference
    Student.tasks = db.relationship("Task", backref="owner", lazy=True)

    # ── Routes ──────────────────────────────────────────────────────────────────

    @app.route("/students-progress", methods=["GET"])
    def get_students_progress():
        today = date.today()
        students = Student.query.all()
        result = []

        for student in students:
            tasks = student.tasks
            total_tasks = len(tasks)

            # Completed tasks: status is explicitly 'completed'
            completed_tasks = [t for t in tasks if t.status == "completed"]

            # Overdue tasks: not completed AND due_date has already passed
            overdue_tasks = [
                t for t in tasks
                if t.status != "completed"
                and t.due_date is not None
                and t.due_date < today
            ]

            # Open tasks: not completed AND not overdue (due_date in future or not set)
            open_tasks = [
                t for t in tasks
                if t.status != "completed"
                and (t.due_date is None or t.due_date >= today)
            ]

            completed_count = len(completed_tasks)
            open_count      = len(open_tasks)
            overdue_count   = len(overdue_tasks)

            # progress = (completed / total) * 100, or 0 when the student has no tasks
            progress = round((completed_count / total_tasks) * 100) if total_tasks > 0 else 0

            # Points are summed from completed tasks only (gamification)
            total_points = sum(t.points for t in completed_tasks)

            # Gamification status label based on progress percentage
            if progress <= 39:
                progress_status = "מתחיל"
            elif progress <= 69:
                progress_status = "בתהליך"
            else:
                progress_status = "מתקדם"

            result.append({
                "student_id":      student.student_id,
                "name":            f"{student.first_name} {student.last_name}",
                "progress":        progress,
                "completed_tasks": completed_count,
                "total_tasks":     total_tasks,
                "open_tasks":      open_count,
                "overdue_tasks":   overdue_count,
                "points":          total_points,
                "status":          progress_status,
            })

        return jsonify(result)

    @app.route("/seed-tasks", methods=["GET"])
    def seed_tasks():
        """Populate demo tasks for testing /students-progress. Run once after /seed-students."""
        if Task.query.count() > 0:
            return jsonify({"message": "tasks already exist"})

        demo_tasks = [
            # Student 1 – 3 of 4 completed → 75% → מתקדם
            Task(student_id=1, title="הגשת עבודה סמינריונית", status="completed",
                 due_date=date.today(), completed_at=datetime.now(), points=10),
            Task(student_id=1, title="קריאת חומר קורס", status="completed",
                 due_date=date.today(), completed_at=datetime.now(), points=10),
            Task(student_id=1, title="פגישה עם מנחה", status="completed",
                 due_date=date.today(), completed_at=datetime.now(), points=10),
            Task(student_id=1, title="הכנת מצגת", status="open",
                 due_date=date.today() + timedelta(days=7), points=10),
            # Student 2 – 1 of 3 completed, 1 overdue → 33% → מתחיל
            Task(student_id=2, title="קריאת מאמרים", status="completed",
                 due_date=date.today(), completed_at=datetime.now(), points=15),
            Task(student_id=2, title="הגשת תרגיל", status="open",
                 due_date=date.today() + timedelta(days=3), points=15),
            Task(student_id=2, title="בחינת אמצע", status="open",
                 due_date=date.today() - timedelta(days=5), points=20),
        ]

        db.session.add_all(demo_tasks)
        db.session.commit()
        return jsonify({"message": "demo tasks seeded successfully"})

    return Task
