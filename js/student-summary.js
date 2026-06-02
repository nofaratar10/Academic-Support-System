document.addEventListener("DOMContentLoaded", () => {

  const params    = new URLSearchParams(window.location.search);
  const studentId = params.get("id");

  // ─── Status helpers ────────────────────────────────────────
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

  // ─── Tabs ──────────────────────────────────────────────────
  function setTabs(id) {
    document.getElementById("detailsTab").href   = `/student-details?id=${id}`;
    document.getElementById("documentsTab").href = `/case-documents?id=${id}`;
    document.getElementById("planTab").href      = `/case-plan?id=${id}`;
    document.getElementById("summaryTab").href   = `/student-summary?id=${id}`;
  }

  // ─── Load student header ───────────────────────────────────
  async function loadStudent() {
    if (!studentId) {
      document.getElementById("studentHeader").textContent = "לא נבחר סטודנט";
      return;
    }
    try {
      const res = await fetch(`/students/${studentId}`);
      if (!res.ok) throw new Error();
      const student = await res.json();
      const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();

      document.getElementById("studentHeader").textContent = `${fullName} | ${student.student_id}`;
      updateStatusBadge(student.support_status || "Open");
      setTabs(student.student_id);
    } catch {
      document.getElementById("studentHeader").textContent = "שגיאה בטעינת הנתונים";
    }
  }

  loadStudent();

  // ─── AI Summary ────────────────────────────────────────────
  const btn              = document.querySelector(".primary-btn");
  const textarea         = document.getElementById("conversationText");
  const fileInput        = document.getElementById("conversationFile");
  const textModeContainer = document.getElementById("textModeContainer");
  const fileModeContainer = document.getElementById("fileModeContainer");
  const selectTextMode   = document.getElementById("selectTextMode");
  const selectFileMode   = document.getElementById("selectFileMode");
  const summaryOutput    = document.getElementById("summaryOutput");
  const pointsOutput     = document.getElementById("pointsOutput");
  const tasksOutput      = document.getElementById("tasksOutput");

  let currentMode = "text";

  selectTextMode.addEventListener("click", () => {
    currentMode = "text";
    selectTextMode.classList.add("active");
    selectFileMode.classList.remove("active");
    textModeContainer.classList.remove("hidden");
    fileModeContainer.classList.add("hidden");
  });

  selectFileMode.addEventListener("click", () => {
    currentMode = "file";
    selectFileMode.classList.add("active");
    selectTextMode.classList.remove("active");
    fileModeContainer.classList.remove("hidden");
    textModeContainer.classList.add("hidden");
  });

  function displaySummaryResults(fullText) {
    summaryOutput.innerText  = "";
    pointsOutput.innerHTML   = "";
    tasksOutput.innerHTML    = "";
    let currentSection = "";

    fullText.split("\n").forEach(line => {
      const clean = line.trim();
      if (clean.startsWith("סיכום:")) {
        summaryOutput.innerText = clean.replace("סיכום:", "").trim();
      } else if (clean.startsWith("נקודות:")) {
        currentSection = "points";
      } else if (clean.startsWith("משימות:")) {
        currentSection = "tasks";
      } else if (clean.startsWith("*") || clean.startsWith("-")) {
        const li = document.createElement("li");
        li.innerText = clean.replace(/^[*-]\s*/, "");
        if (currentSection === "points") pointsOutput.appendChild(li);
        if (currentSection === "tasks")  tasksOutput.appendChild(li);
      }
    });
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    try {
      let response;
      if (currentMode === "text") {
        const text = textarea.value.trim();
        if (!text) return alert("תכניסי תוכן שיחה קודם 🙂");
        btn.innerText = "המערכת מנתחת טקסט...";
        response = await fetch("/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
      } else {
        const file = fileInput.files[0];
        if (!file) return alert("אנא בחרי קובץ אודיו או וידאו להעלאה 📄");
        btn.innerText = "מעלה ומנתח קובץ (זה עשוי לקחת דקה)...";
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch("/summarize-audio", { method: "POST", body: formData });
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      displaySummaryResults(data.summary_result);
    } catch (error) {
      console.error(error);
      alert("שגיאה בתהליך הסיכום: " + error.message);
    } finally {
      btn.innerText = "✨ יצירת סיכום";
      btn.disabled  = false;
    }
  });

  // ─── Save summary ──────────────────────────────────────────
  document.querySelector(".table-footer .btn").addEventListener("click", async () => {
    const summaryText = summaryOutput.innerText;
    if (!summaryText) return alert("קודם צריך ליצור סיכום 🙂");

    try {
      const response = await fetch("/support-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, summary: summaryText, status: "Open" })
      });
      if (response.ok) {
        alert("הסיכום נשמר בהצלחה 🎉");
      } else {
        alert("שגיאה בשמירה לשרת");
      }
    } catch (error) {
      console.error(error);
      alert("בעיה בחיבור לשרת");
    }
  });

});
