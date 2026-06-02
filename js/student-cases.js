document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("studentsTableBody");

    function getSupportStatusClass(status) {
        if (!status) return "status-pill status-pending";
        const normalized = status.toLowerCase();
        if (normalized.includes("open") || normalized.includes("פתוח")) {
            return "status-pill status-open";
        }
        if (normalized.includes("closed") || normalized.includes("סגור")) {
            return "status-pill status-closed";
        }
        return "status-pill status-pending";
    }

    function translateSupportStatus(status) {
        if (!status) return "מושהה";
        const normalized = status.toLowerCase();
        if (normalized.includes("open")) return "פתוח";
        if (normalized.includes("closed")) return "סגור";
        if (normalized.includes("pending")) return "מושהה";
        return status;
    }

    function renderStudents(students) {
        tableBody.innerHTML = "";

        if (students.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">אין סטודנטים רשומים במערכת 📄</td></tr>`;
            return;
        }

        students.forEach((student) => {
            const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();
            const supportStatus = translateSupportStatus(student.support_status || "Open");

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${fullName}</td>
                <td><span class="${getSupportStatusClass(student.support_status)}">${supportStatus}</span></td>
                <td>${student.task_status || "הושלם"}</td>
                <td style="display:flex;gap:6px;align-items:center;">
                    <a href="/student-details?id=${student.student_id}" class="primary-btn">תיק ליווי מלא</a>
                    <button class="delete-icon-btn delete-student-btn" data-id="${student.student_id}" title="מחיקת תיק">
                        <span class="trash-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6"></path>
                                <path d="M14 11v6"></path>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                            </svg>
                        </span>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    async function deleteStudent(studentId) {
        if (!confirm("האם למחוק את תיק הסטודנט? פעולה זו תמחק גם את כל הפניות והמשימות הקשורות.")) return;
        try {
            const res = await fetch(`/students/${studentId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            await loadStudents();
        } catch (err) {
            console.error(err);
            alert("שגיאה במחיקת הסטודנט");
        }
    }

    tableBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".delete-student-btn");
        if (!btn) return;
        deleteStudent(btn.dataset.id);
    });

    async function loadStudents() {
        try {
            const response = await fetch("/students");
            if (!response.ok) {
                throw new Error("Failed to load students");
            }

            const students = await response.json();
            renderStudents(students);
            window.dispatchEvent(new Event("dataLoaded"));

        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:red;">שגיאה בטעינת הסטודנטים. ודאי ששרת הפייתון רץ.</td>
                </tr>
            `;
        }
    }

    loadStudents();
});
