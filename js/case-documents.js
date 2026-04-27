const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

const studentHeader = document.getElementById("studentHeader");
const documentsTableBody = document.getElementById("documentsTableBody");
const toast = document.getElementById("toast");

const detailsTab = document.getElementById("detailsTab");
const documentsTab = document.getElementById("documentsTab");
const planTab = document.getElementById("planTab");
const summaryTab = document.getElementById("summaryTab");

const docNameInput = document.getElementById("docName");
const docTypeSelect = document.getElementById("docType");
const addDocumentBtn = document.getElementById("addDocumentBtn");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function setTabs(studentIdValue) {
  detailsTab.href = `student-details.html?id=${studentIdValue}`;
  documentsTab.href = `case-documents.html?id=${studentIdValue}`;
  planTab.href = `case-plan.html?id=${studentIdValue}`;
  summaryTab.href = `student-summary.html?id=${studentIdValue}`;
}

function getStorageKey() {
  return `student_documents_${studentId}`;
}

function getDocuments() {
  const raw = localStorage.getItem(getStorageKey());
  return raw ? JSON.parse(raw) : [];
}

function saveDocuments(documents) {
  localStorage.setItem(getStorageKey(), JSON.stringify(documents));
}

function renderDocuments() {
  const documents = getDocuments();
  documentsTableBody.innerHTML = "";

  if (documents.length === 0) {
    documentsTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">אין מסמכים עדיין</td>
      </tr>
    `;
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

window.deleteDocument = function deleteDocument(index) {
  const documents = getDocuments();
  documents.splice(index, 1);
  saveDocuments(documents);
  renderDocuments();
  showToast("המסמך נמחק");
};

function addDocument() {
  const name = docNameInput.value.trim();
  const type = docTypeSelect.value;

  if (!name || !type) {
    showToast("יש למלא שם מסמך וסוג התאמה");
    return;
  }

  const documents = getDocuments();
  documents.push({
    name,
    type,
    uploadDate: new Date().toLocaleDateString("he-IL"),
    status: "הועלה"
  });

  saveDocuments(documents);
  renderDocuments();

  docNameInput.value = "";
  docTypeSelect.value = "";

  showToast("המסמך נוסף");
}

async function loadStudent() {
  if (!studentId) {
    studentHeader.textContent = "לא נבחר סטודנט";
    return;
  }

  try {
    const response = await fetch(`http://vmedu473.mtacloud.co.il:5000/students/${studentId}`);
    if (!response.ok) {
      throw new Error("Student not found");
    }

    const student = await response.json();
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();

    studentHeader.textContent = `${fullName} | ${student.student_id}`;
    setTabs(student.student_id);
  } catch (error) {
    console.error(error);
    studentHeader.textContent = "שגיאה בטעינת הנתונים";
  }
}

addDocumentBtn.addEventListener("click", addDocument);

loadStudent();
renderDocuments();