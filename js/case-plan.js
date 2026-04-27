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
const taskModal = document.getElementById("taskModal");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");

const taskNameInput = document.getElementById("taskName");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskDueDateInput = document.getElementById("taskDueDate");
const taskStatusInput = document.getElementById("taskStatus");

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
    planTableBody.innerHTML = `<tr><td colspan="5">שגיאה בטעינת המשימות</td></tr>`;
  }
}

function renderTasks(tasks) {
  planTableBody.innerHTML = "";

  if (!tasks.length) {
    planTableBody.innerHTML = `<tr><td colspan="5">אין משימות לסטודנט זה</td></tr>`;
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
  const task = prompt("כתבי קטגוריית משימה / שם משימה:");
  if (!task) return;

  const description = prompt("כתבי תיאור משימה:") || "";
  const dueDate = prompt("כתבי תאריך יעד:") || new Date().toLocaleDateString("he-IL");
  const status = prompt("כתבי סטטוס: פתוח / בביצוע / הושלם") || "פתוח";

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

addTaskBtn.addEventListener("click", () => {
  taskModal.classList.add("visible");
});

cancelTaskBtn.addEventListener("click", () => {
  taskModal.classList.remove("visible");
});
saveTaskBtn.addEventListener("click", async () => {
  const task = taskNameInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const dueDate = taskDueDateInput.value;
  const status = taskStatusInput.value;

  if (!task) {
    alert("צריך למלא שם משימה");
    return;
  }

  try {
    const response = await fetch(`http://vmedu473.mtacloud.co.il:5000/students/${studentId}/tasks`, {
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

    if (!response.ok) throw new Error();

    taskModal.classList.remove("visible");
    await loadTasks();
    showToast("המשימה נוספה");

  } catch (err) {
    console.error(err);
    alert("שגיאה");
  }
});

loadStudent();
loadTasks();