document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("studentsTableBody");
    const searchInput = document.getElementById("searchInput");
    const filterInput = document.getElementById("filterInput");
    const filterYear = document.getElementById("filterYear");
    const filterSemester = document.getElementById("filterSemester");

    const ITEMS_PER_PAGE = 10;
    let allStudents = [];
    let currentPage = 1;

    function getSupportStatusClass(status) {
        if (!status) return "status-pill status-pending";
        const s = status.toLowerCase();
        if (s.includes("open") || s.includes("פתוח")) return "status-pill status-open";
        if (s.includes("closed") || s.includes("סגור")) return "status-pill status-closed";
        return "status-pill status-pending";
    }

    function translateSupportStatus(status) {
        if (!status) return "מושהה";
        const s = status.toLowerCase();
        if (s.includes("open")) return "פתוח";
        if (s.includes("closed")) return "סגור";
        if (s.includes("pending")) return "מושהה";
        return status;
    }

    function getFilteredStudents() {
        const topSearch = (searchInput?.value || "").trim().toLowerCase();
        const bottomFilter = (filterInput?.value || "").trim().toLowerCase();
        const yearFilter = (filterYear?.value || "").trim().toLowerCase();
        const semesterFilter = (filterSemester?.value || "").trim().toLowerCase();

        return allStudents.filter(student => {
            const fullName = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase();
            const idStr = String(student.student_id);
            const status = translateSupportStatus(student.support_status).toLowerCase();
            const year = (student.academic_year || "").toLowerCase();
            const semester = (student.semester || "").toLowerCase();
            const searchText = `${fullName} ${idStr} ${status}`;

            if (topSearch && !searchText.includes(topSearch)) return false;
            if (bottomFilter && !searchText.includes(bottomFilter)) return false;
            if (yearFilter && !year.includes(yearFilter)) return false;
            if (semesterFilter && !semester.includes(semesterFilter)) return false;
            return true;
        });
    }

    function renderStudents(students) {
        tableBody.innerHTML = "";

        if (!students.length) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">אין סטודנטים תואמים לחיפוש</td></tr>`;
            return;
        }

        students.forEach(student => {
            const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();
            const supportStatus = translateSupportStatus(student.support_status || "Open");
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${fullName}</td>
                <td><span class="${getSupportStatusClass(student.support_status)}">${supportStatus}</span></td>
                <td>${student.academic_year || "—"}</td>
                <td>${student.semester || "—"}</td>
                <td style="display:flex;gap:6px;align-items:center;justify-content:center;">
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

    function renderPagination(total, totalPages) {
        const paginationEl = document.getElementById("pagination");
        if (!paginationEl) return;
        paginationEl.innerHTML = "";

        if (totalPages <= 1) return;

        const prevBtn = document.createElement("button");
        prevBtn.className = "pagination-btn";
        prevBtn.textContent = "‹";
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => { currentPage--; renderPage(); });
        paginationEl.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
            btn.textContent = i;
            btn.addEventListener("click", () => { currentPage = i; renderPage(); });
            paginationEl.appendChild(btn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.className = "pagination-btn";
        nextBtn.textContent = "›";
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => { currentPage++; renderPage(); });
        paginationEl.appendChild(nextBtn);
    }

    function renderPage() {
        const filtered = getFilteredStudents();
        const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
        if (currentPage > totalPages) currentPage = 1;

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        renderStudents(filtered.slice(start, start + ITEMS_PER_PAGE));
        renderPagination(filtered.length, totalPages);
    }

    async function deleteStudent(studentId) {
        if (!confirm("האם למחוק את תיק הסטודנט? פעולה זו תמחק גם את כל הפניות והמשימות הקשורות.")) return;
        try {
            const res = await fetch(`/students/${studentId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            allStudents = allStudents.filter(s => s.student_id !== parseInt(studentId));
            renderPage();
        } catch {
            alert("שגיאה במחיקת הסטודנט");
        }
    }

    tableBody.addEventListener("click", e => {
        const btn = e.target.closest(".delete-student-btn");
        if (!btn) return;
        deleteStudent(btn.dataset.id);
    });

    if (searchInput) searchInput.addEventListener("input", () => { currentPage = 1; renderPage(); });
    if (filterInput) filterInput.addEventListener("input", () => { currentPage = 1; renderPage(); });
    if (filterYear) filterYear.addEventListener("input", () => { currentPage = 1; renderPage(); });
    if (filterSemester) filterSemester.addEventListener("input", () => { currentPage = 1; renderPage(); });

    async function loadStudents() {
        try {
            const res = await fetch("/students");
            if (!res.ok) throw new Error("Failed to load students");
            allStudents = await res.json();
            currentPage = 1;
            renderPage();
        } catch {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;color:red;">שגיאה בטעינת הסטודנטים. ודאי ששרת הפייתון רץ.</td>
                </tr>
            `;
        }
    }

    loadStudents();
});
