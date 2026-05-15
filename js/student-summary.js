const API_BASE_URL = "http://vmedu473.mtacloud.co.il:5000";

document.addEventListener("DOMContentLoaded", () => {

  // ===== 📌 שליפת ID מה-URL =====
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");

  if (!studentId) {
    alert("לא נבחר סטודנט");
    window.location.href = "/student-cases";
    return;
  }

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

  // ===== 🧠 אלמנטים =====
  const btn = document.querySelector(".primary-btn");
  const textarea = document.getElementById("conversationText");
  const summaryOutput = document.getElementById("summaryOutput");
  const pointsOutput = document.getElementById("pointsOutput");
  const tasksOutput = document.getElementById("tasksOutput");

  // ===== ✨ יצירת סיכום AI (דרך השרת המאובטח) =====
  btn.addEventListener("click", async () => {

    const text = textarea.value.trim();
    if (!text) return alert("תכניסי תוכן שיחה קודם 🙂");

    btn.innerText = "המערכת מנתחת...";
    btn.disabled = true;

    try {
      // ✅ פנייה לשרת הפייתון שלך במקום ישירות לגוגל
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // השגת הטקסט שחזר מהשרת
      const fullText = data.summary_result;

      // ניקוי תוצאות קודמות מהמסך
      summaryOutput.innerText = "";
      pointsOutput.innerHTML = "";
      tasksOutput.innerHTML = "";

      let currentSection = "";

      // פירוק הטקסט שחזר והצגתו במסכים
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