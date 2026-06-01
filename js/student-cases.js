document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("studentsTableBody");
    let allStudents = [];

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
                <td>
                    <a href="/student-details?id=${student.student_id}" class="primary-btn">תיק ליווי מלא</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    async function loadStudents() {
        try {
            const response = await fetch("/students");
            if (!response.ok) {
                throw new Error("Failed to load students");
            }

            allStudents = await response.json();
            renderStudents(allStudents);
            
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