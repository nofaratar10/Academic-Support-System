from flask import jsonify
from datetime import date, datetime, timedelta


def _parse_due_date(value):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return None
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        except ValueError:
            return None
    return None


def init_process3(app, db, Student, Task):

    # ── Routes ──────────────────────────────────────────────────────────────────

    @app.route("/students-progress", methods=["GET"])
    def get_students_progress():
        today = date.today()
        students = Student.query.all()
        result = []
        completed_statuses = {"completed", "הושלם", "בוצע", "סגור"}

        for student in students:
            tasks = Task.query.filter_by(student_id=student.student_id).all()
            total_tasks = len(tasks)

            completed_tasks = [t for t in tasks if str(t.status or "").strip().lower() in completed_statuses]

            overdue_tasks = [
                t for t in tasks
                if str(t.status or "").strip().lower() not in completed_statuses
                and _parse_due_date(t.due_date) is not None
                and _parse_due_date(t.due_date) < today
            ]

            open_tasks = [
                t for t in tasks
                if str(t.status or "").strip().lower() not in completed_statuses
                and (_parse_due_date(t.due_date) is None or _parse_due_date(t.due_date) >= today)
            ]

            completed_count = len(completed_tasks)
            open_count      = len(open_tasks)
            overdue_count   = len(overdue_tasks)

            progress = round((completed_count / total_tasks) * 100) if total_tasks > 0 else 0

            total_points = sum((getattr(t, "points", 10) or 10) for t in completed_tasks)

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
            Task(student_id=1, task="הגשת עבודה סמינריונית", status="הושלם",
                 due_date=date.today().isoformat(), description=""),
            Task(student_id=1, task="קריאת חומר קורס", status="הושלם",
                 due_date=date.today().isoformat(), description=""),
            Task(student_id=1, task="פגישה עם מנחה", status="הושלם",
                 due_date=date.today().isoformat(), description=""),
            Task(student_id=1, task="הכנת מצגת", status="פתוח",
                 due_date=(date.today() + timedelta(days=7)).isoformat(), description=""),
            Task(student_id=2, task="קריאת מאמרים", status="הושלם",
                 due_date=date.today().isoformat(), description=""),
            Task(student_id=2, task="הגשת תרגיל", status="פתוח",
                 due_date=(date.today() + timedelta(days=3)).isoformat(), description=""),
            Task(student_id=2, task="בחינת אמצע", status="פתוח",
                 due_date=(date.today() - timedelta(days=5)).isoformat(), description=""),
        ]

        db.session.add_all(demo_tasks)
        db.session.commit()
        return jsonify({"message": "demo tasks seeded successfully"})

    return Task
