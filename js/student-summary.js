const API_KEY = "AIzaSyD0_bxpUReEKbfXvPA__oDdpirXCeGWRqU"; 
// כשאתן עובדות מקומית
const API_BASE_URL = 'http://127.0.0.1:5000'; 

// כשזה יעלה לשרת, פשוט תחליפי לשורה הזו (ותשימי את השורה למעלה בהערה):
// const API_BASE_URL = 'https://the-real-server-address.com';

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".primary-btn");
    const textarea = document.getElementById("conversationText");
    const summaryOutput = document.getElementById("summaryOutput");
    const pointsOutput = document.getElementById("pointsOutput");
    const tasksOutput = document.getElementById("tasksOutput");

    btn.addEventListener("click", async () => {
        const text = textarea.value.trim();
        if (!text) return alert("תכניסי תוכן שיחה קודם 🙂");

        btn.innerText = "Gemini 2.5 מנתח...";
        btn.disabled = true;

        try {
            // הכתובת המדויקת לפי הרשימה שקיבלת מה-Console
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `אתה עוזר רכזת ליווי במכללת MTA. סכם את השיחה הבאה בפורמט הבא בדיוק:
                            סיכום: [פסקה אחת]
                            נקודות:
                            * [נקודה]
                            משימות:
                            * [משימה]
                            
                            השיחה: ${text}`
                        }]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            const fullText = data.candidates[0].content.parts[0].text;

            // פירוק התשובה לתיבות
            summaryOutput.innerText = "";
            pointsOutput.innerHTML = "";
            tasksOutput.innerHTML = "";

            const lines = fullText.split('\n');
            let currentSection = "";

            lines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine.startsWith("סיכום:")) {
                    summaryOutput.innerText = cleanLine.replace("סיכום:", "").trim();
                } else if (cleanLine.startsWith("נקודות:")) {
                    currentSection = "points";
                } else if (cleanLine.startsWith("משימות:")) {
                    currentSection = "tasks";
                } else if (cleanLine.startsWith("*") || cleanLine.startsWith("-")) {
                    const li = document.createElement("li");
                    li.innerText = cleanLine.replace(/^[*|-]\s*/, "").trim();
                    if (currentSection === "points") pointsOutput.appendChild(li);
                    if (currentSection === "tasks") tasksOutput.appendChild(li);
                }
            });

            console.log("בינה מלאכותית דור 2.5 עובדת!");

        } catch (error) {
            console.error("שגיאה:", error);
            alert("שגיאה: " + error.message);
        } finally {
            btn.innerText = "✨ יצירת סיכום";
            btn.disabled = false;
        }
    });
});

// פונקציה לשליחת הנתונים ל-PHP
async function saveSummaryToDB(studentName, summary, points, tasks) {
    try {
        const response = await fetch('../PHP/save-summary.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_name: studentName,
                summary_text: summary,
                key_points: points,
                next_tasks: tasks
            })
        });

        const result = await response.json();
        if (result.success) {
            alert("הסיכום נשמר בהצלחה בתיק הסטודנט!");
        }
    } catch (error) {
        console.error("Error saving:", error);
    }
}


// פונקציה לשמירת הסיכום ב-Database של ה-Python
async function saveToDatabase() {
    const summaryText = document.getElementById("summaryOutput").innerText;
    
    // אם אין סיכום, אל תשלחי סתם
    if (!summaryText || summaryText === "מעבד..." || summaryText === "מעבד את הנתונים...") {
        return alert("קודם צריך ליצור סיכום כדי לשמור אותו 🙂");
    }

    try {
        // הכתובת של ה-Python (לפי הקוד ששלחת)
        const url = `${API_BASE_URL}/support-files`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: 1, // בשלב זה שמנו 1, הבנות יגידו לך איך למשוך את ה-ID האמיתי
                summary: summaryText,
                status: "Open"
            })
        });

        if (response.ok) {
            alert("הסיכום נשמר בהצלחה ב-Database! 🎉");
        } else {
            const errorData = await response.json();
            alert("שגיאת שרת: " + errorData.error);
        }
    } catch (error) {
        console.error("Save Error:", error);
        alert("לא ניתן להתחבר לשרת ה-Backend. וודאי שהבנות הריצו את ה-Python ושאין בעיית CORS.");
    }
}

// חיבור לכפתור השמירה שב-HTML שלך
// (הכפתור שנמצא בתוך ה-table-footer)
document.querySelector(".table-footer .btn").addEventListener("click", saveToDatabase);