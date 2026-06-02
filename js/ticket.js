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
      <td style="display:flex;gap:6px;align-items:center;">
        <a href="/view-ticket?id=${ticket.ticket_id}" class="primary-btn">פתיחה</a>
        <button class="delete-icon-btn delete-btn" data-id="${ticket.ticket_id}" title="מחיקת פנייה">
          <span class="trash-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
          </span>
        </button>
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

async function deleteTicket(ticketId) {
  if (!confirm("האם למחוק את הפנייה?")) return;
  try {
    const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    allTickets = allTickets.filter(t => t.ticket_id !== parseInt(ticketId));
    applyFilters();
  } catch (err) {
    console.error(err);
    alert("שגיאה במחיקת הפנייה");
  }
}

// Event delegation for delete buttons
tableBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;
  deleteTicket(btn.dataset.id);
});

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
