const form = document.querySelector("#studentForm");
const toast = document.querySelector("#toast");
const refreshBtn = document.querySelector("#refreshStudentBtn");

const params = new URLSearchParams(window.location.search);
const studentId = params.get("id");

function setSelectValueOrAdd(selectId, value) {
  if (!value) return;

  const select = document.getElementById(selectId);
  const exists = [...select.options].some(
    (option) => option.value === value || option.text === value
  );

  if (!exists) {
    const newOption = document.createElement("option");
    newOption.value = value;
    newOption.text = value;
    select.add(newOption);
  }

  select.value = value;
}

function getHebrewStatus(status) {
  if (!status) return "פתוח";

  const normalized = status.toLowerCase();
  if (normalized.includes("open")) return "פתוח";
  if (normalized.includes("closed")) return "סגור";
  if (normalized.includes("pending")) return "מושהה";
  return status;
}

function getStatusClass(status) {
  const normalized = (status || "").toLowerCase();

  if (normalized.includes("open") || normalized.includes("פתוח")) {
    return "status-pill status-open";
  }
  if (normalized.includes("closed") || normalized.includes("סגור")) {
    return "status-pill status-closed";
  }
  return "status-pill status-pending";
}

function setTabs(studentIdValue) {
  document.getElementById("detailsTab").href = `student-details.html?id=${studentIdValue}`;
  document.getElementById("documentsTab").href = `case-documents.html?id=${studentIdValue}`;
  document.getElementById("planTab").href = `case-plan.html?id=${studentIdValue}`;
  document.getElementById("summaryTab").href = `student-summary.html?id=${studentIdValue}`;
}

async function loadStudent() {
  if (!studentId) {
    document.getElementById("studentHeader").textContent = "לא נבחר סטודנט";
    return;
  }

  try {
    const response = await fetch(`http://vmedu473.mtacloud.co.il:5000/students/${studentId}`);
    if (!response.ok) {
      throw new Error("Student not found");
    }

    const student = await response.json();
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();

    document.getElementById("studentHeader").textContent =
      `${fullName} | ${student.student_id}`;

    document.getElementById("name").value = fullName;
    document.getElementById("idNumber").value = student.student_id || "";
    document.getElementById("phone").value = student.phone || "";
    document.getElementById("email").value = student.email || "";

    setSelectValueOrAdd("year", student.academic_year || "");
    setSelectValueOrAdd("track", student.track || "");
    setSelectValueOrAdd("semester", student.semester || "");

    const statusPill = document.getElementById("statusPill");
    const supportStatus = student.support_status || "Open";
    statusPill.textContent = getHebrewStatus(supportStatus);
    statusPill.className = getStatusClass(supportStatus);

    setTabs(student.student_id);
  } catch (error) {
    console.error(error);
    document.getElementById("studentHeader").textContent = "שגיאה בטעינת הנתונים";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2200);
});

refreshBtn.addEventListener("click", loadStudent);

loadStudent();