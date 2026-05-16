const ticketsTableBody = document.getElementById("ticketsTableBody");
const ticketSearch = document.getElementById("ticketSearch");

function openTicket(id) {
  window.location.href = `/view-ticket?id=${id}`;
}

function renderTickets(tickets) {
  ticketsTableBody.innerHTML = "";

  if (!tickets.length) {
    ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="5">אין פניות עדיין</td>
      </tr>
    `;
    return;
  }

  tickets.forEach((ticket) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${ticket.ticket_id}</td>
      <td>${ticket.recipient || ""}</td>
      <td>${ticket.subject || ""}</td>
      <td><span class="status-pill new">${ticket.status || "חדש"}</span></td>
      <td>
        <button class="action-btn" onclick="openTicket(${ticket.ticket_id})">פתיחה</button>
      </td>
    `;

    ticketsTableBody.appendChild(row);
  });
}

async function loadTickets() {
  try {
    const response = await fetch("/api/tickets");
    if (!response.ok) throw new Error("Failed to load tickets");

    const tickets = await response.json();
    renderTickets(tickets);
  } catch (error) {
    console.error(error);
    ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="5">שגיאה בטעינת הפניות</td>
      </tr>
    `;
  }
}

if (ticketSearch) {
  ticketSearch.addEventListener("input", () => {
    const value = ticketSearch.value.toLowerCase();
    const rows = ticketsTableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(value) ? "" : "none";
    });
  });
}

loadTickets();