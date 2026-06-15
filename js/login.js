document.addEventListener("DOMContentLoaded", () => {
  const form          = document.getElementById("loginForm");
  const emailInput    = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginBtn      = document.getElementById("loginBtn");
  const loginError    = document.getElementById("loginError");
  const togglePwd     = document.getElementById("togglePassword");
  const ssoBtn        = document.getElementById("ssoBtn");

  // ─── demo credentials ─────────────────────────────────
  const DEMO_EMAIL    = "polina@example.com";
  const DEMO_PASSWORD = "1234";

  // ─── show/hide password ───────────────────────────────
  togglePwd.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePwd.textContent = isPassword ? "🙈" : "👁";
  });

  // ─── hide error on input ──────────────────────────────
  [emailInput, passwordInput].forEach(el => {
    el.addEventListener("input", () => loginError.classList.add("hidden"));
  });

  // ─── submit ───────────────────────────────────────────
  form.addEventListener("submit", e => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      loginError.textContent = "יש למלא את כל השדות.";
      loginError.classList.remove("hidden");
      return;
    }

    loginBtn.disabled   = true;
    loginBtn.textContent = "מתחבר...";

    // demo login — replace with real API call when ready
    setTimeout(() => {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        sessionStorage.setItem("loggedIn", "true");
        window.location.href = "/student-cases";
      } else {
        loginError.textContent = "אימייל או סיסמה שגויים. נסה שוב.";
        loginError.classList.remove("hidden");
        loginBtn.disabled    = false;
        loginBtn.textContent = "כניסה למערכת";
        passwordInput.value  = "";
        passwordInput.focus();
      }
    }, 600);
  });

  // ─── SSO (demo) ───────────────────────────────────────
  ssoBtn.addEventListener("click", () => {
    ssoBtn.textContent = "מעביר לממשק המכללה...";
    ssoBtn.disabled = true;
    setTimeout(() => {
      ssoBtn.textContent = "כניסה עם חשבון מכללתי (SSO)";
      ssoBtn.disabled = false;
      alert("SSO אינו מוגדר בסביבת הדמו.");
    }, 800);
  });
});
