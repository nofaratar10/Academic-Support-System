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
  summaryTab.href = `case-summary.html?id=${studentIdValue}`;
}

function getStorageKey() {
  return `student_plan_${studentId}`;
}

function getTasks() {
  const raw = localStorage.getItem(getStorageKey());

  if (raw) {
    return JSON.parse(raw);
  }

  return [
    {
      task: "פגישה עם מלווה",
      description: "תיאום פגישה אישית",
      dueDate: "15.9.26",
      status: "בביצוע"
    },
    {
      task: "תיאום תגבור",
      description: "פנייה לדיקנט",
      dueDate: "20.9.26",
      status: "הושלם"
    },
    {
      task: "הגשת ערעור",
      description: "קורס מתמטיקה",
      dueDate: "25.9.26",
      status: "פתוח"
    },
    {
      task: "תיאום תגבור",
      description: "קורס מתמטיקה",
      dueDate: "26.8.26",
      status: "פתוח"
    }
  ];
}

function saveTasks(tasks) {
  localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
}

function renderTasks() {
  const tasks = getTasks();
  planTableBody.innerHTML = "";

  tasks.forEach((item, index) => {
    const row = document.createElement("tr");

    const statusClass = item.status === "מחיקה" ? "plan-task-warning" : "";
    row.innerHTML = `
      <td>${item.task}</td>
      <td>${item.description}</td>
      <td>${item.dueDate}</td>
      <td class="${statusClass}">${item.status}</td>
      <td>
        <button class="btn" type="button" onclick="deleteTask(${index})">עריכה</button>
      </td>
    `;

    planTableBody.appendChild(row);
  });
}

window.deleteTask = function deleteTask(index) {
  const tasks = getTasks();
  tasks.splice(index, 1);
  saveTasks(tasks);
  renderTasks();
  showToast("המשימה הוסרה");
};

function addTask() {
  const tasks = getTasks();
  tasks.push({
    task: "משימה חדשה",
    description: "משימה שנוספה ידנית",
    dueDate: new Date().toLocaleDateString("he-IL"),
    status: "פתוח"
  });

  saveTasks(tasks);
  renderTasks();
  showToast("המשימה נוספה");
};

async function loadStudent() {
  if (!studentId) {
    studentHeader.textContent = "לא נבחר סטודנט";
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:5000/students/${studentId}`);
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

addTaskBtn.addEventListener("click", addTask);

loadStudent();
renderTasks();