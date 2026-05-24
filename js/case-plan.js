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
  setTimeout(() => toast.classList.remove("visible"), 2200);
}

function setTabs(id) {
  detailsTab.href = `/student-details?id=${id}`;
  documentsTab.href = `/case-documents?id=${id}`;
  planTab.href = `/case-plan?id=${id}`;
  summaryTab.href = `/student-summary?id=${id}`;
}

function getStatusClass(status) {
  if (status === "הושלם") return "status-pill status-closed";
  if (status === "בביצוע") return "status-pill status-progress";
  return "status-pill status-open";
}

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
    setTabs(student.student_id);
  } catch {
    studentHeader.textContent = "שגיאה בטעינת הנתונים";
  }
}

async function loadTasks() {
  try {
    const res = await fetch(`/students/${studentId}/tasks`);
    if (!res.ok) throw new Error();
    const tasks = await res.json();
    renderTasks(tasks);
  } catch {
    planTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">שגיאה בטעינת המשימות</td></tr>`;
  }
}

function renderTasks(tasks) {
  planTableBody.innerHTML = "";
  if (!tasks.length) {
    planTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">אין משימות עדיין</td></tr>`;
    return;
  }
  tasks.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.task || ""}</td>
      <td>${item.description || ""}</td>
      <td>${item.dueDate || ""}</td>
      <td><span class="${getStatusClass(item.status)}">${item.status || "פתוח"}</span></td>
      <td>
        <button class="btn" type="button" onclick="deleteTask(${item.task_id})">מחיקה</button>
      </td>
    `;
    planTableBody.appendChild(row);
  });
}

window.deleteTask = async function(taskId) {
  if (!confirm("למחוק את המשימה?")) return;
  try {
    const res = await fetch(`/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    await loadTasks();
    showToast("המשימה נמחקה");
  } catch {
    alert("שגיאה במחיקת משימה");
  }
};

addTaskBtn.addEventListener("click", () => {
  taskNameInput.value = "";
  taskDescriptionInput.value = "";
  taskDueDateInput.value = "";
  taskStatusInput.value = "פתוח";
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
    alert("יש למלא שם משימה");
    return;
  }

  try {
    const res = await fetch(`/students/${studentId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, description, dueDate, status })
    });
    if (!res.ok) throw new Error();
    taskModal.classList.remove("visible");
    await loadTasks();
    showToast("המשימה נוספה");
  } catch {
    alert("שגיאה בהוספת משימה");
  }
});

loadStudent();
loadTasks();