const API_BASE_URL = window.location.origin;

const SOURCE_LABELS = {
  text: "טקסט ידני",
  audio: "קובץ אודיו",
  video: "קובץ וידאו",
};

const SOURCE_CLASSES = {
  text: "badge-text",
  audio: "badge-audio",
  video: "badge-video",
};

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");

  if (!studentId) {
    alert("לא נבחר סטודנט");
    window.location.href = "/student-cases";
    return;
  }

  // ─── טאבים ────────────────────────────────────────────────
  document.getElementById("detailsTab").href = `/student-details?id=${studentId}`;
  document.getElementById("documentsTab").href = `/case-documents?id=${studentId}`;
  document.getElementById("planTab").href = `/case-plan?id=${studentId}`;
  document.getElementById("summaryTab").href = `/student-summary?id=${studentId}`;

  function getHebrewStatus(status) {
    if (!status) return "פתוח";
    const s = status.toLowerCase();
    if (s.includes("open"))    return "פתוח";
    if (s.includes("closed"))  return "סגור";
    if (s.includes("pending")) return "מושהה";
    return status;
  }

  function getStatusClass(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("open")   || s.includes("פתוח"))  return "status-pill status-open";
    if (s.includes("closed") || s.includes("סגור"))  return "status-pill status-closed";
    return "status-pill status-pending";
  }

  fetch(`${API_BASE_URL}/students/${studentId}`)
    .then(res => res.json())
    .then(student => {
      const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim();
      document.getElementById("studentHeader").textContent = `${fullName} | ${student.student_id}`;
      const pill = document.getElementById("statusPill");
      if (pill) {
        pill.textContent = getHebrewStatus(student.support_status);
        pill.className = getStatusClass(student.support_status);
      }
    });

  // ─── אלמנטים ──────────────────────────────────────────────
  const generateBtn   = document.getElementById("generateBtn");
  const saveBtn       = document.getElementById("saveBtn");
  const newSummaryBtn = document.getElementById("newSummaryBtn");
  const textarea      = document.getElementById("conversationText");
  const fileInput     = document.getElementById("conversationFile");
  const textModeContainer = document.getElementById("textModeContainer");
  const fileModeContainer = document.getElementById("fileModeContainer");
  const selectTextMode    = document.getElementById("selectTextMode");
  const selectFileMode    = document.getElementById("selectFileMode");
  const summaryOutput = document.getElementById("summaryOutput");
  const pointsOutput  = document.getElementById("pointsOutput");
  const tasksOutput   = document.getElementById("tasksOutput");
  const summaryResult = document.getElementById("summaryResult");
  const prevSummariesList = document.getElementById("prevSummariesList");
  const noSummariesMsg    = document.getElementById("noSummariesMsg");

  let currentMode = "text";
  let lastSummaryText = "";

  // ─── בחירת מצב קלט ────────────────────────────────────────
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

  // ─── פרסור תוצאת AI ───────────────────────────────────────
  function parseSummary(fullText) {
    const result = { summary: "", points: [], tasks: [] };
    let section = "";

    (fullText || "").split("\n").forEach(line => {
      const clean = line.trim();
      if (clean.startsWith("סיכום:")) {
        result.summary = clean.replace("סיכום:", "").trim();
      } else if (clean.startsWith("נקודות:")) {
        section = "points";
      } else if (clean.startsWith("משימות:")) {
        section = "tasks";
      } else if (clean.startsWith("*") || clean.startsWith("-")) {
        const item = clean.replace(/^[*-]\s*/, "");
        if (section === "points") result.points.push(item);
        if (section === "tasks") result.tasks.push(item);
      }
    });

    return result;
  }

  function displaySummaryResults(fullText) {
    const parsed = parseSummary(fullText);

    summaryOutput.innerText = parsed.summary;

    pointsOutput.innerHTML = "";
    parsed.points.forEach(p => {
      const li = document.createElement("li");
      li.innerText = p;
      pointsOutput.appendChild(li);
    });

    tasksOutput.innerHTML = "";
    parsed.tasks.forEach(t => {
      const li = document.createElement("li");
      li.innerText = t;
      tasksOutput.appendChild(li);
    });

    summaryResult.classList.remove("hidden");
  }

  // ─── עיצוב תאריך ──────────────────────────────────────────
  function formatDateTime(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    return `${dateStr} בשעה ${timeStr}`;
  }

  // ─── בניית פריט אקורדיון ──────────────────────────────────
  function buildAccordionItem(record) {
    const parsed   = parseSummary(record.summary || "");
    const srcType  = record.source_type || "text";
    const label    = SOURCE_LABELS[srcType] || srcType;
    const badgeCls = SOURCE_CLASSES[srcType] || "badge-text";

    const pointsHtml = parsed.points.length
      ? `<ul>${parsed.points.map(p => `<li>${p}</li>`).join("")}</ul>`
      : "<p class='empty-section'>לא נמצאו נקודות</p>";

    const tasksHtml = parsed.tasks.length
      ? `<ul>${parsed.tasks.map(t => `<li>${t}</li>`).join("")}</ul>`
      : "<p class='empty-section'>לא נמצאו משימות</p>";

    const item = document.createElement("div");
    item.className = "acc-item";
    item.dataset.id = record.case_id;

    item.innerHTML = `
      <div class="acc-header">
        <div class="acc-header-info">
          <span class="card-date">${formatDateTime(record.created_at || record.open_date)}</span>
          <span class="source-badge ${badgeCls}">${label}</span>
        </div>
        <div class="acc-header-actions">
          <button class="acc-delete-btn" title="מחיקת סיכום" type="button">🗑</button>
          <span class="acc-arrow">▶</span>
        </div>
      </div>
      <div class="acc-body hidden">
        <div class="card-section">
          <h5>סיכום כללי</h5>
          <p>${parsed.summary || "—"}</p>
        </div>
        <div class="card-section">
          <h5>נקודות מרכזיות</h5>
          ${pointsHtml}
        </div>
        <div class="card-section">
          <h5>משימות להמשך</h5>
          ${tasksHtml}
        </div>
      </div>
    `;

    // פתיחה / סגירה
    item.querySelector(".acc-header").addEventListener("click", e => {
      if (e.target.closest(".acc-delete-btn")) return;
      const body  = item.querySelector(".acc-body");
      const arrow = item.querySelector(".acc-arrow");
      const isOpen = !body.classList.contains("hidden");
      body.classList.toggle("hidden", isOpen);
      arrow.textContent = isOpen ? "▶" : "▼";
    });

    // מחיקה
    item.querySelector(".acc-delete-btn").addEventListener("click", async () => {
      if (!confirm("למחוק את הסיכום הזה?")) return;
      try {
        const res = await fetch(`${API_BASE_URL}/support-files/${record.case_id}`, {
          method: "DELETE"
        });
        if (!res.ok) throw new Error();
        item.remove();
        if (!prevSummariesList.querySelector(".acc-item")) {
          prevSummariesList.appendChild(noSummariesMsg);
        }
      } catch {
        alert("שגיאה במחיקת הסיכום");
      }
    });

    return item;
  }

  // ─── טעינת סיכומים קודמים ─────────────────────────────────
  function loadPreviousSummaries() {
    fetch(`${API_BASE_URL}/support-files?student_id=${studentId}`)
      .then(res => res.json())
      .then(records => {
        prevSummariesList.innerHTML = "";

        if (!records.length) {
          prevSummariesList.appendChild(noSummariesMsg);
          return;
        }

        records.forEach(record => {
          prevSummariesList.appendChild(buildAccordionItem(record));
        });
      })
      .catch(() => {
        prevSummariesList.innerHTML = "<p class='no-summaries-msg'>שגיאה בטעינת הסיכומים</p>";
      });
  }

  loadPreviousSummaries();

  // ─── יצירת סיכום ──────────────────────────────────────────
  generateBtn.addEventListener("click", async () => {
    // נעילת הכפתור מיד — לפני כל בדיקה
    generateBtn.disabled = true;
    generateBtn.innerText = "מכינה...";
    lastSummaryText = "";
    summaryResult.classList.add("hidden");

    try {
      let response;

      if (currentMode === "text") {
        const text = textarea.value.trim();
        if (!text) {
          alert("יש להזין תוכן שיחה לפני יצירת הסיכום");
          return;
        }
        generateBtn.innerText = "המערכת מנתחת טקסט...";

        response = await fetch(`${API_BASE_URL}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });

      } else {
        const file = fileInput.files[0];
        if (!file) {
          alert("יש לבחור קובץ אודיו או וידאו להעלאה");
          return;
        }

        // שלב א: תמלול
        generateBtn.innerText = "מתמלל קובץ... (עשוי לקחת דקה)";
        const formData = new FormData();
        formData.append("file", file);

        const transcribeRes = await fetch(`${API_BASE_URL}/transcribe-audio`, {
          method: "POST",
          body: formData
        });
        const transcribeData = await transcribeRes.json();
        if (transcribeData.error) throw new Error(transcribeData.error);

        const transcription = transcribeData.transcription;

        // שלב ב: מעבר למצב טקסט עם התמלול
        textarea.value = transcription;
        currentMode = "text";
        selectTextMode.classList.add("active");
        selectFileMode.classList.remove("active");
        textModeContainer.classList.remove("hidden");
        fileModeContainer.classList.add("hidden");

        // שלב ג: סיכום על בסיס התמלול
        generateBtn.innerText = "מנתח את התמלול...";
        response = await fetch(`${API_BASE_URL}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcription })
        });
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      lastSummaryText = data.summary_result;
      displaySummaryResults(lastSummaryText);

    } catch (error) {
      console.error(error);
      alert("שגיאה בתהליך הסיכום: " + error.message);
    } finally {
      generateBtn.innerText = "✨ יצירת סיכום";
      generateBtn.disabled = false;
    }
  });

  // ─── שמירת סיכום ──────────────────────────────────────────
  saveBtn.addEventListener("click", async () => {
    if (!lastSummaryText) {
      alert("יש ליצור סיכום לפני השמירה");
      return;
    }

    const file = fileInput.files[0];
    let sourceType = "text";
    if (currentMode === "file" && file) {
      sourceType = file.type.startsWith("video/") ? "video" : "audio";
    }

    try {
      const response = await fetch(`${API_BASE_URL}/support-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          summary: lastSummaryText,
          source_type: sourceType,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "שגיאה בשרת");
      }

      alert("הסיכום נשמר בהצלחה");
      loadPreviousSummaries();
      newSummaryBtn.classList.remove("hidden");
      saveBtn.classList.add("hidden");

    } catch (error) {
      console.error(error);
      alert("שגיאה בשמירה: " + error.message);
    }
  });

  // ─── סיכום נוסף ───────────────────────────────────────────
  newSummaryBtn.addEventListener("click", () => {
    textarea.value = "";
    fileInput.value = "";
    summaryOutput.innerText = "";
    pointsOutput.innerHTML = "";
    tasksOutput.innerHTML = "";
    lastSummaryText = "";
    summaryResult.classList.add("hidden");
    saveBtn.classList.remove("hidden");
    newSummaryBtn.classList.add("hidden");

    currentMode = "text";
    selectTextMode.classList.add("active");
    selectFileMode.classList.remove("active");
    textModeContainer.classList.remove("hidden");
    fileModeContainer.classList.add("hidden");

    document.getElementById("createSummaryTitle").scrollIntoView({ behavior: "smooth" });
  });

});
