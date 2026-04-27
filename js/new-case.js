const form = document.getElementById("newCaseForm");
const API_BASE_URL = "http://vmedu473.mtacloud.co.il:5000";

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    first_name: document.getElementById("first_name").value.trim(),
    last_name: document.getElementById("last_name").value.trim(),
    academic_year: document.getElementById("academic_year").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim()
  };

  if (!data.first_name || !data.last_name) {
    alert("חובה למלא שם פרטי ושם משפחה");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "שגיאה ביצירת סטודנט");
      return;
    }

    window.location.href = `student-details.html?id=${result.student_id}`;

  } catch (error) {
    console.error("שגיאה:", error);
    alert("שגיאה בחיבור לשרת. ודאי שהשרת עדיין רץ.");
  }
});