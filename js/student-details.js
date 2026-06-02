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

function updateStatusBadge(status) {
  const statusPill = document.getElementById("statusPill");
  if (!statusPill) return;
  statusPill.textContent = getHebrewStatus(status);
  statusPill.className = getStatusClass(status);
}

function setTabs(studentIdValue) {
  document.getElementById("detailsTab").href = `/student-details?id=${studentIdValue}`;
  document.getElementById("documentsTab").href = `/case-documents?id=${studentIdValue}`;
  document.getElementById("planTab").href = `/case-plan?id=${studentIdValue}`;
  document.getElementById("summaryTab").href = `/student-summary?id=${studentIdValue}`;
}

async function loadStudent() {
  if (!studentId) {
    document.getElementById("studentHeader").textContent = "לא נבחר סטודנט";
    return;
  }

  try {
    const response = await fetch(`/students/${studentId}`);
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

    const supportStatus = student.support_status || "Open";

    // Fill the editable status select
    const statusSelect = document.getElementById("statusSelect");
    if (statusSelect) statusSelect.value = supportStatus;

    // Update the badge in the header bar
    updateStatusBadge(supportStatus);

    setTabs(student.student_id);
  } catch (error) {
    console.error(error);
    document.getElementById("studentHeader").textContent = "שגיאה בטעינת הנתונים";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!studentId) return;

  const selectedStatus = document.getElementById("statusSelect")?.value || "Open";
  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(`/students/${studentId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: selectedStatus })
    });

    if (!res.ok) throw new Error("שגיאה בשמירה");

    // Update badge to reflect the new status
    updateStatusBadge(selectedStatus);

    toast.textContent = "הפרטים נשמרו";
    toast.classList.add("visible");
    window.setTimeout(() => toast.classList.remove("visible"), 2200);

  } catch (err) {
    console.error(err);
    alert("שגיאה בשמירת הסטטוס");
  } finally {
    submitBtn.disabled = false;
  }
});

refreshBtn.addEventListener("click", loadStudent);

loadStudent();
