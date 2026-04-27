const API_KEY = "AIzaSyD0_bxpUReEKbfXvPA__oDdpirXCeGWRqU";
const API_BASE_URL = "http://vmedu473.mtacloud.co.il:5000";

document.addEventListener("DOMContentLoaded", () => {

  // ===== 📌 שליפת ID מה-URL =====
  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("id");

  if (!studentId) {
    alert("לא נבחר סטודנט");
    window.location.href = "student-cases.html";
    return;
  }

  // ===== 🔗 עדכון טאבים =====
  document.getElementById("detailsTab").href = `student-details.html?id=${studentId}`;
  document.getElementById("documentsTab").href = `case-documents.html?id=${studentId}`;
  document.getElementById("planTab").href = `case-plan.html?id=${studentId}`;
  document.getElementById("summaryTab").href = `student-summary.html?id=${studentId}`;

  // ===== 👤 טעינת שם סטודנט =====
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

  // ===== ✨ יצירת סיכום AI =====
  btn.addEventListener("click", async () => {

    const text = textarea.value.trim();
    if (!text) return alert("תכניסי תוכן שיחה קודם 🙂");

    btn.innerText = "Gemini מנתח...";
    btn.disabled = true;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `סכם את השיחה בפורמט:
סיכום: ...
נקודות:
* ...
משימות:
* ...

השיחה: ${text}`
            }]
          }]
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const fullText = data.candidates[0].content.parts[0].text;

      // ניקוי תוצאות
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

    } catch (error) {
      console.error(error);
      alert("שגיאה: " + error.message);
    } finally {
      btn.innerText = "✨ יצירת סיכום";
      btn.disabled = false;
    }
  });

  // ===== 💾 שמירה ל-DB =====
  document.querySelector(".table-footer .btn").addEventListener("click", async () => {

    const summaryText = summaryOutput.innerText;

    if (!summaryText) {
      return alert("קודם צריך ליצור סיכום 🙂");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/support-files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          student_id: studentId,
          summary: summaryText,
          status: "Open"
        })
      });

      if (response.ok) {
        alert("הסיכום נשמר בהצלחה 🎉");
      } else {
        alert("שגיאה בשמירה");
      }

    } catch (error) {
      console.error(error);
      alert("בעיה בחיבור לשרת");
    }
  });

});