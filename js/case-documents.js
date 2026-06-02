const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

const studentHeader = document.getElementById("studentHeader");
const documentsTableBody = document.getElementById("documentsTableBody");
const toast = document.getElementById("toast");

const detailsTab   = document.getElementById("detailsTab");
const documentsTab = document.getElementById("documentsTab");
const planTab      = document.getElementById("planTab");
const summaryTab   = document.getElementById("summaryTab");

const docNameInput    = document.getElementById("docName");
const docTypeSelect   = document.getElementById("docType");
const addDocumentBtn  = document.getElementById("addDocumentBtn");

// ─── Status helpers (same logic as student-details.js) ──────
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

// ─── Toast ──────────────────────────────────────────────────
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

// ─── Tabs ───────────────────────────────────────────────────
function setTabs(id) {
  detailsTab.href   = `/student-details?id=${id}`;
  documentsTab.href = `/case-documents?id=${id}`;
  planTab.href      = `/case-plan?id=${id}`;
  summaryTab.href   = `/student-summary?id=${id}`;
}

// ─── Documents (localStorage) ───────────────────────────────
function getStorageKey()       { return `student_documents_${studentId}`; }
function getDocuments()        { const r = localStorage.getItem(getStorageKey()); return r ? JSON.parse(r) : []; }
function saveDocuments(docs)   { localStorage.setItem(getStorageKey(), JSON.stringify(docs)); }

function renderDocuments() {
  const documents = getDocuments();
  documentsTableBody.innerHTML = "";

  if (!documents.length) {
    documentsTableBody.innerHTML = `<tr><td colspan="5" class="empty-row">אין מסמכים עדיין</td></tr>`;
    return;
  }

  documents.forEach((doc, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doc.name}</td>
      <td>${doc.type}</td>
      <td>${doc.uploadDate}</td>
      <td><span class="status-pill status-open">${doc.status}</span></td>
      <td>
        <button class="btn" type="button" onclick="deleteDocument(${index})">מחיקה</button>
      </td>
    `;
    documentsTableBody.appendChild(row);
  });
}

window.deleteDocument = function (index) {
  const documents = getDocuments();
  documents.splice(index, 1);
  saveDocuments(documents);
  renderDocuments();
  showToast("המסמך נמחק");
};

function addDocument() {
  const name = docNameInput.value.trim();
  const type = docTypeSelect.value;

  if (!name || !type) { showToast("יש למלא שם מסמך וסוג התאמה"); return; }

  const documents = getDocuments();
  documents.push({ name, type, uploadDate: new Date().toLocaleDateString("he-IL"), status: "הועלה" });
  saveDocuments(documents);
  renderDocuments();

  docNameInput.value  = "";
  docTypeSelect.value = "";
  showToast("המסמך נוסף");
}

// ─── Load student ────────────────────────────────────────────
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
renderDocuments();
