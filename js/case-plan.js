const API_BASE_URL = "http://vmedu473.mtacloud.co.il:5000";

const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

const studentHeader = document.getElementById("studentHeader");
const planTableBody = document.getElementById("planTableBody");
const toast = document.getElementById("toast");

const detailsTab = document.getElementById("detailsTab");
const documentsTab = document.getElementById("documentsTab");
const planTab = document.getElementById("planTab");
const summaryTab = document.getElementById("summaryTab");

const addTaskBtn = document.getElementById("addTaskBtn");

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

    studentHeader.textContent = `${fullName} | ${student.student_id}`;
    setTabs(student.student_id);
  } catch (error) {
    console.error(error);
    studentHeader.textContent = "שגיאה בטעינת הנתונים";
  }
}

async function loadTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/tasks`);
    if (!response.ok) throw new Error("Failed to load tasks");

    const tasks = await response.json();
    renderTasks(tasks);
  } catch (error) {
    console.error(error);
    planTableBody.innerHTML = `
      <tr>
        <td colspan="5">שגיאה בטעינת המשימות</td>
      </tr>
    `;
  }
}

function renderTasks(tasks) {
  planTableBody.innerHTML = "";

  if (tasks.length === 0) {
    planTableBody.innerHTML = `
      <tr>
        <td colspan="5">אין משימות לסטודנט זה</td>
      </tr>
    `;
    return;
  }

  tasks.forEach((item) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.task || ""}</td>
      <td>${item.description || ""}</td>
      <td>${item.dueDate || ""}</td>
      <td>${item.status || "פתוח"}</td>
      <td>
        <button class="btn" type="button" onclick="deleteTask(${item.task_id})">מחיקה</button>
      </td>
    `;

    planTableBody.appendChild(row);
  });
}

async function addTask() {
  const task = document.getElementById("taskName").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const dueDate = document.getElementById("taskDueDate").value;
  const status = document.getElementById("taskStatus").value;

  if (!task) {
    alert("צריך למלא קטגוריית משימה");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/students/${studentId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        task,
        description,
        dueDate,
        status
      })
    });

    if (!response.ok) throw new Error("Failed to create task");

    document.getElementById("taskName").value = "";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskDueDate").value = "";
    document.getElementById("taskStatus").value = "פתוח";

    await loadTasks();
    showToast("המשימה נוספה");
  } catch (error) {
    console.error(error);
    alert("שגיאה בהוספת משימה");
  }
}

window.deleteTask = async function deleteTask(taskId) {
  const confirmDelete = confirm("למחוק את המשימה?");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE"
    });

    if (!response.ok) throw new Error("Failed to delete task");

    await loadTasks();
    showToast("המשימה נמחקה");
  } catch (error) {
    console.error(error);
    alert("שגיאה במחיקת משימה");
  }
};

addTaskBtn.addEventListener("click", addTask);

loadStudent();
loadTasks();