const form = document.getElementById("newCaseForm");

function showError(fieldId, errorId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errorId);
  if (!field || !err) return;
  if (message) {
    field.classList.add("input-invalid");
    err.textContent = message;
  } else {
    field.classList.remove("input-invalid");
    err.textContent = "";
  }
}

function validatePhone(phone) {
  if (!phone) return true; // not required
  const clean = phone.replace(/-/g, "").replace(/\s/g, "");
  return /^05\d{8}$/.test(clean);
}

function cleanPhone(phone) {
  return phone.replace(/-/g, "").replace(/\s/g, "");
}

function validateForm() {
  let valid = true;

  const firstName = document.getElementById("first_name").value.trim();
  const lastName  = document.getElementById("last_name").value.trim();
  const phone     = document.getElementById("phone").value.trim();

  if (!firstName) {
    showError("first_name", "firstNameError", "שם פרטי הוא שדה חובה");
    valid = false;
  } else {
    showError("first_name", "firstNameError", "");
  }

  if (!lastName) {
    showError("last_name", "lastNameError", "שם משפחה הוא שדה חובה");
    valid = false;
  } else {
    showError("last_name", "lastNameError", "");
  }

  if (phone && !validatePhone(phone)) {
    showError("phone", "phoneError", "מספר טלפון לא תקין. פורמט נדרש: 05XXXXXXXX");
    valid = false;
  } else {
    showError("phone", "phoneError", "");
  }

  return valid;
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const phoneRaw = document.getElementById("phone").value.trim();

  const data = {
    first_name:    document.getElementById("first_name").value.trim(),
    last_name:     document.getElementById("last_name").value.trim(),
    academic_year: document.getElementById("academic_year").value.trim(),
    email:         document.getElementById("email").value.trim() || null,
    phone:         phoneRaw ? cleanPhone(phoneRaw) : null,
    status:        document.getElementById("status").value
  };

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "שומר...";

  try {
    const response = await fetch("/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "שגיאה ביצירת סטודנט");
    }

    const result = await response.json();
    window.location.href = `/student-details?id=${result.student_id}`;

  } catch (error) {
    console.error("שגיאה:", error);
    alert(error.message || "שגיאה ביצירת סטודנט");
    submitBtn.disabled = false;
    submitBtn.textContent = "שמירה ופתיחת תיק";
  }
});
