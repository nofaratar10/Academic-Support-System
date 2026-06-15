const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

const studentHeader      = document.getElementById("studentHeader");
const documentsTableBody = document.getElementById("documentsTableBody");
const toast              = document.getElementById("toast");

const detailsTab   = document.getElementById("detailsTab");
const documentsTab = document.getElementById("documentsTab");
const planTab      = document.getElementById("planTab");
const summaryTab   = document.getElementById("summaryTab");

const docNameInput   = document.getElementById("docName");
const docFileInput   = document.getElementById("docFile");
const addDocumentBtn = document.getElementById("addDocumentBtn");

// ─── Status helpers ──────────────────────────────────────────
function getHebrewStatus(status) {
  if (!status) return "פתוח";
  const s = status.toLowerCase();
  if (s.includes("open"))    return "פתוח";
  if (s.includes("closed"))  return "סגור";
  if (s.includes("pending")) return "מושהה";
  return status;
}

function getStudentStatusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("open")   || s.includes("פתוח"))  return "status-pill status-open";
  if (s.includes("closed") || s.includes("סגור"))  return "status-pill status-closed";
  return "status-pill status-pending";
}

function updateStatusBadge(status) {
  const pill = document.getElementById("statusPill");
  if (!pill) return;
  pill.textContent = getHebrewStatus(status);
  pill.className   = getStudentStatusClass(status);
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

// ─── Tabs ────────────────────────────────────────────────────
function setTabs(id) {
  detailsTab.href   = `/student-details?id=${id}`;
  documentsTab.href = `/case-documents?id=${id}`;
  planTab.href      = `/case-plan?id=${id}`;
  summaryTab.href   = `/student-summary?id=${id}`;
}

// ─── Render documents ─────────────────────────────────────────
function renderDocuments(documents) {
  documentsTableBody.innerHTML = "";

  if (!documents.length) {
    documentsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:20px;color:#888;">אין מסמכים עדיין</td></tr>`;
    return;
  }

  documents.forEach(doc => {
    const fileUrl = doc.filename ? `/uploads/${doc.filename}` : "";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doc.name}</td>
      <td>${doc.filename || "—"}</td>
      <td>${doc.upload_date || ""}</td>
      <td style="display:flex;gap:6px;align-items:center;justify-content:center;">
        ${fileUrl
          ? `<a href="${fileUrl}" target="_blank" class="primary-btn">פתיחה</a>`
          : `<button class="primary-btn" type="button" disabled>פתיחה</button>`}
        <button class="delete-icon-btn delete-doc-btn" type="button" data-id="${doc.id}" title="מחיקת מסמך">
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
    documentsTableBody.appendChild(row);
  });
}

// ─── Load documents from API ──────────────────────────────────
async function loadDocuments() {
  if (!studentId) return;
  try {
    const res = await fetch(`/students/${studentId}/documents`);
    if (!res.ok) throw new Error();
    const docs = await res.json();
    renderDocuments(docs);
  } catch {
    documentsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#c00;">שגיאה בטעינת המסמכים</td></tr>`;
  }
}

// ─── Delete document ─────────────────────────────────────────
documentsTableBody.addEventListener("click", async e => {
  const btn = e.target.closest(".delete-doc-btn");
  if (!btn) return;
  if (!confirm("האם למחוק מסמך זה?")) return;

  const docId = btn.dataset.id;
  try {
    const res = await fetch(`/documents/${docId}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    showToast("המסמך נמחק");
    loadDocuments();
  } catch {
    showToast("שגיאה במחיקת המסמך");
  }
});

// ─── Upload document ──────────────────────────────────────────
async function addDocument() {
  const name = docNameInput.value.trim();
  const file = docFileInput.files[0];

  if (!name)  { showToast("יש למלא שם מסמך");  return; }
  if (!file)  { showToast("יש לבחור קובץ");     return; }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", file);

  addDocumentBtn.disabled = true;
  try {
    const res = await fetch(`/students/${studentId}/documents`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) {
      let msg = "שגיאה בהעלאת המסמך";
      try {
        const err = await res.json();
        if (err && err.error) msg = err.error;
      } catch { /* non-JSON error response */ }
      showToast(msg);
      return;
    }
    docNameInput.value = "";
    docFileInput.value = "";
    showToast("המסמך הועלה בהצלחה");
    loadDocuments();
  } catch {
    showToast("שגיאה בהעלאת המסמך");
  } finally {
    addDocumentBtn.disabled = false;
  }
}

// ─── Load student ─────────────────────────────────────────────
async function loadStudent() {
  if (!studentId) {
    studentHeader.textContent = "לא נבחר סטודנט";
    return;
  }
  try {
    const res = await fetch(`/students/${studentId}`);
    if (!res.ok) throw new Error();
    const student = await res.json();
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();

    studentHeader.textContent = `${fullName} | ${student.student_id}`;
    updateStatusBadge(student.support_status || "Open");
    setTabs(student.student_id);
  } catch {
    studentHeader.textContent = "שגיאה בטעינת הנתונים";
  }
}

addDocumentBtn.addEventListener("click", addDocument);

loadStudent();
loadDocuments();
