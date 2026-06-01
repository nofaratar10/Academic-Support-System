const API_BASE_URL = window.location.origin;

document.addEventListener("DOMContentLoaded", () => {

  // ===== 📌 שליפת ID מה-URL =====
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");

  /*
  if (!studentId) {
    alert("לא נבחר סטודנט");
    window.location.href = "/student-cases";
    return;
  }
  */

  // ===== 🔗 עדכון טאבים =====
  document.getElementById("detailsTab").href = `/student-details?id=${studentId}`;
  document.getElementById("documentsTab").href = `/case-documents?id=${studentId}`;
  document.getElementById("planTab").href = `/case-plan?id=${studentId}`;
  document.getElementById("summaryTab").href = `/student-summary?id=${studentId}`;

  // ===== 👤 טעינת שם סטודנט מהשרת =====
  fetch(`${API_BASE_URL}/students/${studentId}`)
    .then(res => res.json())
    .then(student => {
      document.querySelector(".student-name").textContent =
        `${student.first_name} ${student.last_name}`;
    });

  // ===== 🧠 אלמנטים ומצבי קלט =====
  const btn = document.querySelector(".primary-btn");
  const textarea = document.getElementById("conversationText");
  const fileInput = document.getElementById("conversationFile");
  
  const textModeContainer = document.getElementById("textModeContainer");
  const fileModeContainer = document.getElementById("fileModeContainer");
  const selectTextMode = document.getElementById("selectTextMode");
  const selectFileMode = document.getElementById("selectFileMode");

  const summaryOutput = document.getElementById("summaryOutput");
  const pointsOutput = document.getElementById("pointsOutput");
  const tasksOutput = document.getElementById("tasksOutput");

  let currentMode = "text"; // מצב ברירת מחדל: text או file

  // החלפת מצב להדבקת טקסט
  selectTextMode.addEventListener("click", () => {
    currentMode = "text";
    selectTextMode.classList.add("active");
    selectFileMode.classList.remove("active");
    textModeContainer.classList.remove("hidden");
    fileModeContainer.classList.add("hidden");
  });

  // החלפת מצב להעלאת קובץ הקלטה
  selectFileMode.addEventListener("click", () => {
    currentMode = "file";
    selectFileMode.classList.add("active");
    selectTextMode.classList.remove("active");
    fileModeContainer.classList.remove("hidden");
    textModeContainer.classList.add("hidden");
  });

  // פונקציה שמפרקת את הטקסט שחוזר מה-AI ומציגה אותו בתיבות הנכונות במסך
  function displaySummaryResults(fullText) {
    summaryOutput.innerText = "";
    pointsOutput.innerHTML = "";
    tasksOutput.innerHTML = "";

    let currentSection = "";

    fullText.split("\n").forEach(line => {
      const clean = line.trim();

      if (clean.startsWith("סיכום:")) {
        summaryOutput.innerText = clean.replace("סיכום:", "").trim();
      }
      else if (clean.startsWith("נקודות:")) {
        currentSection = "points";
      }
      else if (clean.startsWith("משימות:")) {
        currentSection = "tasks";
      }
      else if (clean.startsWith("*") || clean.startsWith("-")) {
        const li = document.createElement("li");
        li.innerText = clean.replace(/^[*-]\s*/, "");

        if (currentSection === "points") pointsOutput.appendChild(li);
        if (currentSection === "tasks") tasksOutput.appendChild(li);
      }
    });
  }

  // ===== ✨ יצירת סיכום בעזרת AI =====
  btn.addEventListener("click", async () => {
    btn.disabled = true;

    try {
      let response;

      if (currentMode === "text") {
        // מצב 1: שליחת טקסט רגיל (JSON)
        const text = textarea.value.trim();
        if (!text) return alert("תכניסי תוכן שיחה קודם 🙂");

        btn.innerText = "המערכת מנתחת טקסט...";

        response = await fetch(`${API_BASE_URL}/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text })
        });

      } else {
        // מצב 2: שליחת קובץ הקלטה/סרטון (FormData)
        const file = fileInput.files[0];
        if (!file) return alert("אנא בחרי קובץ אודיו או וידאו להעלאה 📄");

        btn.innerText = "מעלה ומנתח קובץ (זה עשוי לקחת דקה)...";

        const formData = new FormData();
        formData.append("file", file);

        response = await fetch(`${API_BASE_URL}/summarize-audio`, {
          method: "POST",
          body: formData // הדפדפן מגדיר את ה-Content-Type לבד כששולחים FormData
        });
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // הצגת התוצאות שחזרו מהשרת
      displaySummaryResults(data.summary_result);

    } catch (error) {
      console.error(error);
      alert("שגיאה בתהליך הסיכום: " + error.message);
    } finally {
      btn.innerText = "✨ יצירת סיכום";
      btn.disabled = false;
    }
  });

  // ===== 💾 שמירת הסיכום לבסיס הנתונים =====
  document.querySelector(".table-footer .btn").addEventListener("click", async () => {
    const summaryText = summaryOutput.innerText;

    if (!summaryText) {
      return alert("קודם צריך ליצור סיכום 🙂");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/support-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          summary: summaryText,
          status: "Open"
        })
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