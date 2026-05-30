const searchInput = document.getElementById("searchInput");
let allData = [];

function getInitials(first, last) {
  return (first?.[0] || "") + (last?.[0] || "");
}

function getBarColor(pct) {
  if (pct === 100) return "#0ca678";
  if (pct >= 70) return "#228be6";
  if (pct >= 40) return "#ef9f27";
  if (pct > 0) return "#ffd43b";
  return "#e5e7eb";
}

function getAlertClass(alert) {
  if (alert === "לא התחיל") return "alert-row alert-danger";
  if (alert === "משימה באיחור" || alert === "ירידה בקצב") return "alert-row alert-warning";
  return "";
}

function getAlertIcon(alert) {
  if (alert === "לא התחיל") return "⚠️";
  if (alert === "משימה באיחור") return "⏰";
  return "📉";
}

function getBadge(rank, data) {
  if (data.pct === 100) return `<span class="badge badge-gold">⭐ מצטיין</span>`;
  if (rank === 1 && data.points > 0) return `<span class="badge badge-gold">🏆 מוביל</span>`;
  if (data.pct > 0 && data.pct < 50) return `<span class="badge badge-silver">📈 בשיפור</span>`;
  return "";
}

function renderSummary(data) {
  const totalDone = data.reduce((s, d) => s + d.done, 0);
  const totalInProgress = data.reduce((s, d) => s + d.in_progress, 0);
  const totalPoints = data.reduce((s, d) => s + d.points, 0);
  const totalAlerts = data.filter(d => d.alert).length;

  document.getElementById("totalDone").textContent = totalDone;
  document.getElementById("totalInProgress").textContent = totalInProgress;
  document.getElementById("totalPoints").textContent = totalPoints;
  document.getElementById("totalAlerts").textContent = totalAlerts;

  const doneEl = document.getElementById("totalDone");
  const alertEl = document.getElementById("totalAlerts");
  doneEl.style.color = "#0ca678";
  alertEl.style.color = totalAlerts > 0 ? "#fa5252" : "#0ca678";
}

function renderLeaderboard(data) {
  const list = document.getElementById("leaderboardList");
  const top = data.filter(d => d.points > 0).slice(0, 5);

  if (!top.length) {
    list.innerHTML = `<div class="empty-row">אין נתונים עדיין</div>`;
    return;
  }

  list.innerHTML = top.map((d, i) => `
    <div class="student-row">
      <span class="rank-num">${i + 1}</span>
      <div class="avatar av-${(i % 4) + 1}">${getInitials(d.first_name, d.last_name)}</div>
      <div style="flex:1;">
        <div class="student-name">${d.first_name} ${d.last_name}</div>
        <div style="margin-top:3px;">${getBadge(i, d)}</div>
      </div>
      <span class="pill pill-gold">${d.points} נק'</span>
    </div>
  `).join("");
}

function renderAlerts(data) {
  const list = document.getElementById("alertsList");
  const alerts = data.filter(d => d.alert);

  if (!alerts.length) {
    list.innerHTML = `<div class="empty-row" style="color:#0ca678;">✅ אין התראות</div>`;
    return;
  }

  list.innerHTML = alerts.map(d => `
    <div class="${getAlertClass(d.alert)}">
      <span style="font-size:16px;">${getAlertIcon(d.alert)}</span>
      <div style="flex:1;">
        <div style="font-size:13px; font-weight:500; color:var(--color-text-primary, #111);">${d.first_name} ${d.last_name}</div>
        <div style="font-size:12px; color:#64748b;">${d.alert}</div>
      </div>
      <a href="/case-plan?id=${d.student_id}" class="btn-small">תיק ליווי</a>
    </div>
  `).join("");
}

function renderAllStudents(data) {
  const list = document.getElementById("allStudentsList");
  document.getElementById("studentCount").textContent = `${data.length} סטודנטים`;

  if (!data.length) {
    list.innerHTML = `<div class="empty-row">אין סטודנטים</div>`;
    return;
  }

  list.innerHTML = data.map(d => `
    <div class="student-row">
      <div class="avatar av-1">${getInitials(d.first_name, d.last_name)}</div>
      <div style="flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="student-name">${d.first_name} ${d.last_name}</span>
          <span style="font-size:12px; color:${d.pct === 100 ? '#0ca678' : d.pct > 0 ? '#228be6' : '#64748b'};">${d.pct}%</span>
        </div>
        <div class="progress-wrap" style="margin-top:5px;">
          <div class="progress-fill" style="width:${d.pct}%; background:${getBarColor(d.pct)};"></div>
        </div>
        <div style="font-size:12px; color:#64748b; margin-top:3px;">
          ${d.done} הושלמו · ${d.in_progress} בביצוע · ${d.total_tasks - d.done - d.in_progress} פתוחות
        </div>
      </div>
      <div style="display:flex; gap:6px; align-items:center; margin-right:10px;">
        <span class="pill ${d.points > 0 ? 'pill-gold' : 'pill-gray'}">${d.points} נק'</span>
        <a href="/case-plan?id=${d.student_id}" class="btn-small">תיק</a>
      </div>
    </div>
  `).join("");
}

function filterAndRender() {
  const search = searchInput.value.trim().toLowerCase();
  const filtered = allData.filter(d =>
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(search)
  );
  renderAllStudents(filtered);
}

async function loadProgress() {
  try {
    // קריאת fetch אמיתית לשרת לפיוני ה-API
    const res = await fetch("/api/progress"); 
    if (!res.ok) throw new Error("שגיאה בתגובת השרת");
    
    const serverData = await res.json();

    allData = serverData.map(student => {
      const nameParts = student.name ? student.name.split(" ") : ["", ""];
      
      const total = student.total_tasks || 0;
      const completed = student.completed_tasks || 0;
      
      let computedAlert = "";
      if (student.progress < 40) computedAlert = "לא התחיל";
      if (student.status === "איחור") computedAlert = "משימה באיחור";

      return {
        student_id: student.student_id,
        first_name: nameParts[0] || "סטודנט",
        last_name: nameParts.slice(1).join(" ") || "",
        pct: student.progress || 0, 
        done: completed,
        in_progress: student.in_progress_tasks || 0, 
        total_tasks: total,
        points: student.points || 0,
        alert: computedAlert
      };
    });

    renderSummary(allData);
    renderLeaderboard(allData);
    renderAlerts(allData);
    renderAllStudents(allData);
    
  } catch (err) {
    console.error("שגיאה קריטית בטעינת הנתונים מהשרת:", err);
    document.getElementById("allStudentsList").innerHTML =
      `<div class="empty-row" style="color:#fa5252;">⚠️ שגיאה בתקשורת עם השרת. ודא ששרת ה-Backend מופעל.</div>`;
  }
}

searchInput.addEventListener("input", filterAndRender);
loadProgress();