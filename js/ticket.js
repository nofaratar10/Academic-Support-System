const tableBody = document.getElementById("ticketsTableBody");
const ticketSearch = document.getElementById("ticketSearch");
const filterInput = document.getElementById("filterInput");
const directionBtns = document.querySelectorAll(".direction-btn");

let allTickets = [];
let currentDir = "all";

function getStatusClass(status) {
  const s = (status || "").trim();
  if (s === "חדש") return "status-pill status-open";
  if (s === "ממתין") return "status-pill status-pending";
  if (s === "דחוף") return "status-pill status-urgent";
  if (s === "בטיפול") return "status-pill status-progress";
  if (s === "סגור") return "status-pill status-closed";
  if (s === "נשלח") return "status-pill status-pending";
  return "status-pill status-pending";
}

function getDirectionLabel(direction) {
  return direction === "incoming" ? "נכנסת ↓" : "יוצאת ↑";
}

function renderTickets(tickets) {
  tableBody.innerHTML = "";

  if (!tickets.length) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;">אין פניות להצגה</td></tr>`;
    return;
  }

  tickets.forEach((ticket) => {
    const senderDisplay = ticket.direction === "incoming"
      ? (ticket.student_name || ticket.recipient)
      : (ticket.sender_name || "פולינה (רכזת)");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${ticket.ticket_id}</td>
      <td>${senderDisplay}</td>
      <td>${ticket.subject}</td>
      <td><span class="${getStatusClass(ticket.status)}">${ticket.status}</span></td>
      <td>
        <a href="/view-ticket?id=${ticket.ticket_id}" class="primary-btn">פתיחה</a>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function applyFilters() {
  const search = (ticketSearch?.value || "").trim().toLowerCase();
  const filter = (filterInput?.value || "").trim().toLowerCase();

  const filtered = allTickets.filter((t) => {
    if (currentDir !== "all" && t.direction !== currentDir) return false;

    const senderDisplay = t.direction === "incoming"
      ? (t.student_name || t.recipient)
      : (t.sender_name || "פולינה (רכזת)");

    const text = `${t.ticket_id} ${senderDisplay} ${t.subject} ${t.status}`.toLowerCase();
    return text.includes(search) && text.includes(filter);
  });

  renderTickets(filtered);
}

async function loadTickets() {
  try {
    const response = await fetch("/api/tickets");
    if (!response.ok) throw new Error("Failed to load tickets");
    allTickets = await response.json();
    applyFilters();
  } catch (error) {
    console.error(error);
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">שגיאה בטעינת הפניות</td></tr>`;
  }
}

// כפתורי כיוון
directionBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    directionBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDir = btn.dataset.dir;
    applyFilters();
  });
});

ticketSearch?.addEventListener("input", applyFilters);
filterInput?.addEventListener("input", applyFilters);

loadTickets();