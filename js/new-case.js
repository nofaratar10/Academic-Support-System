const form = document.getElementById("newCaseForm");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    academic_year: document.getElementById("academic_year").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value
  };

  try {
    const response = await fetch("http://vmedu473.mtacloud.co.il:5000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    // 🔥 מעבר לתיק עם ID
    window.location.href = `student-details.html?id=${result.student_id}`;

  } catch (error) {
    console.error("שגיאה:", error);
    alert("שגיאה ביצירת סטודנט");
  }
});