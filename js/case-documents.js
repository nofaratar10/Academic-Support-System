const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

const API_BASE_URL = window.location.origin; 

const studentHeader = document.getElementById("studentHeader");
const documentsTableBody = document.getElementById("documentsTableBody");
const toast = document.getElementById("toast");

const detailsTab = document.getElementById("detailsTab");
const documentsTab = document.getElementById("documentsTab");
const planTab = document.getElementById("planTab");
const summaryTab = document.getElementById("summaryTab");

const docNameInput = document.getElementById("docName");
const docTypeSelect = document.getElementById("docType");
const filePickerInput = document.getElementById("filePicker"); 
const addDocumentBtn = document.getElementById("addDocumentBtn");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function setTabs(studentIdValue) {
  detailsTab.href = `/student-details?id=${studentIdValue}`;
  documentsTab.href = `/case-documents?id=${studentIdValue}`;
  planTab.href = `/case-plan?id=${studentIdValue}`;
  summaryTab.href = `/student-summary?id=${studentIdValue}`;
}

async function renderDocuments() {
  if (!studentId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/documents`);
    if (!response.ok) throw new Error("Failed to load documents");
    
    const documents = await response.json();
    documentsTableBody.innerHTML = "";

    if (documents.length === 0) {
      documentsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-row" style="text-align:center; padding: 20px; color: #888;">אין מסמכים פתוחים בתיק זה עדיין 📄</td>
        </tr>
      `;
      return;
    }

    documents.forEach((doc) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><a href="${API_BASE_URL}${doc.url}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: underline;">📄 ${doc.name}</a></td>
        <td>${doc.doc_type}</td>
        <td>${doc.upload_date}</td>
        <td><span class="status-pill status-open">${doc.status}</span></td>
        <td>
          <button class="btn" type="button" style="color: red; border-color: #fca5a5;" onclick="deleteDocument(${doc.id})">מחיקה</button>
        </td>
      `;
      documentsTableBody.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    documentsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">שגיאה בטעינת רשימת המסמכים מהשרת.</td></tr>`;
  }
}

window.deleteDocument = async function deleteDocument(docId) {
  if (!confirm("האם את בטוחה שברצונך למחוק מסמך זה? ⚠️")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      renderDocuments();
      showToast("המסמך נמחק בהצלחה");
    } else {
      showToast("שגיאה במחיקת המסמך מהשרת");
    }
  } catch (error) {
    console.error(error);
    alert("בעיית חיבור לשרת בזמן המחיקה");
  }
};

async function addDocument() {
  const name = docNameInput.value.trim();
  const type = docTypeSelect.value;
  const file = filePickerInput.files[0]; 

  if (!name || !type || !file) {
    alert("חובה למלא שם מסמך, לבחור סוג התאמה ולצרף קובץ פיזי מהמחשב! 📂");
    return;
  }

  addDocumentBtn.disabled = true;
  addDocumentBtn.innerText = "מעלה קובץ...";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);
  formData.append("type", type);

  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/documents`, {
      method: "POST",
      body: formData 
    });

    if (response.ok) {
      showToast("המסמך הועלה ונשמר בהצלחה 🎉");
      docNameInput.value = "";
      docTypeSelect.value = "";
      filePickerInput.value = ""; 
      renderDocuments(); 
    } else {
      const errData = await response.json();
      alert("שגיאה בהעלאה: " + (errData.error || "תקלת שרת"));
    }
  } catch (error) {
    console.error(error);
    alert("בעיית חיבור לשרת: לא ניתן להעלות את הקובץ.");
  } finally {
    addDocumentBtn.innerText = "העלאת מסמך +";
    addDocumentBtn.disabled = false;
  }
}

async function loadStudent() {
  if (!studentId) {
    studentHeader.textContent = "לא נבחר סטודנט";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`);
    if (!response.ok) throw new Error("Student not found");

    const student = await response.json();
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();

    studentHeader.textContent = `${fullName} | מס' סטודנט: ${student.student_id}`;
    setTabs(student.student_id);
  } catch (error) {
    console.error(error);
    studentHeader.textContent = "שגיאה בטעינת נתוני סטודנט";
  }
}

addDocumentBtn.addEventListener("click", addDocument);

loadStudent();
renderDocuments();