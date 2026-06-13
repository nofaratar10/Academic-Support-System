document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("ticketsTableBody");
  const ticketSearch = document.getElementById("ticketSearch");
  const filterInput = document.getElementById("filterInput");
  const directionBtns = document.querySelectorAll(".direction-btn");

  const STORAGE_KEY = "tickets_data";
  const ITEMS_PER_PAGE = 10;
  const URGENT_KEYWORDS = ["דחוף", "היום", "מחר", "מבחן", "הגשה", "התאמות", "מילואים", "אישור", "לא מצליח"];

  let allTickets = [];
  let currentDir = "all";
  let currentPage = 1;

  // ─── localStorage helpers ─────────────────────────────────
  function getStoredTickets() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }

  function computeUrgency(subject, content) {
    const text = `${subject || ""} ${content || ""}`;
    return URGENT_KEYWORDS.some(kw => text.includes(kw)) ? "דחוף" : "רגיל";
  }

  // ─── Demo seed if empty ───────────────────────────────────
  function seedIfEmpty() {
    const existing = getStoredTickets();
    if (existing.length > 0) return;

    const now = Date.now();
    const demo = [
      {
        ticket_id: 1001,
        subject: "בקשה לדחיית הגשה בגלל מילואים",
        content: "שלום, אני לא מצליח להגיש את הפרויקט בזמן. שירתתי במילואים בתאריך ההגשה.",
        recipient: "יוסי כהן", sender_name: "יוסי כהן",
        direction: "incoming", status: "חדש",
        created_at: new Date(now - 86400000).toISOString(), messages: []
      },
      {
        ticket_id: 1002,
        subject: "אישור מועד מיוחד למבחן",
        content: "הייתי במילואים בתאריך המבחן. מבקש מועד מיוחד להגשה.",
        recipient: "שירה כהן", sender_name: "שירה כהן",
        direction: "incoming", status: "בטיפול",
        created_at: new Date(now - 172800000).toISOString(), messages: []
      },
      {
        ticket_id: 1003,
        subject: "פנייה לסטודנט לגבי התאמות",
        content: "שלום, רצינו לבדוק לגבי ההתאמות שלך ולעזור בתהליך.",
        recipient: "תומר כהן", sender_name: "פולינה (רכזת)",
        direction: "outgoing", status: "ממתין",
        created_at: new Date(now - 259200000).toISOString(), messages: []
      },
      {
        ticket_id: 1004,
        subject: "קושי עם מרצה לאחר מילואים",
        content: "חזרתי מהמילואים ואני מתקשה להשלים את החומר מהמרצה.",
        recipient: "דנה לוי", sender_name: "דנה לוי",
        direction: "incoming", status: "חדש",
        created_at: new Date(now - 43200000).toISOString(), messages: []
      }
    ];

    demo.forEach(t => { t.urgency = computeUrgency(t.subject, t.content); });
    saveTickets(demo);
  }

  // ─── Status / Urgency styling ─────────────────────────────
  function getStatusClass(status) {
    if (status === "חדש")    return "status-pill status-open";
    if (status === "בטיפול") return "status-pill status-progress";
    if (status === "ממתין")  return "status-pill status-pending";
    if (status === "נסגר")   return "status-pill status-closed";
    return "status-pill status-pending";
  }

  function getUrgencyClass(urgency) {
    return urgency === "דחוף" ? "status-pill status-urgent" : "status-pill urgency-normal";
  }

  // ─── Filter ───────────────────────────────────────────────
  function getFiltered() {
    const search = (ticketSearch?.value || "").trim().toLowerCase();
    const filter = (filterInput?.value || "").trim().toLowerCase();

    return allTickets.filter(t => {
      if (currentDir !== "all" && t.direction !== currentDir) return false;
      const studentDisplay = t.direction === "incoming"
        ? (t.sender_name || t.recipient)
        : "פולינה (רכזת)";
      const broadcastText = t.broadcast ? "תפוצה כל הסטודנטים" : "";
      const text = `${t.ticket_id} ${studentDisplay} ${t.subject} ${t.status} ${broadcastText}`.toLowerCase();
      return text.includes(search) && text.includes(filter);
    });
  }

  // ─── Render table ─────────────────────────────────────────
  function renderTickets(tickets) {
    tableBody.innerHTML = "";

    if (!tickets.length) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;">אין פניות להצגה</td></tr>`;
      return;
    }

    tickets.forEach(ticket => {
      const senderDisplay = ticket.direction === "incoming"
        ? (ticket.sender_name || ticket.recipient)
        : "פולינה (רכזת)";

      const broadcastBadge = ticket.broadcast
        ? `<span class="status-pill" style="background:#e7f5ff;color:#1864ab;margin-left:6px;">תפוצה</span>`
        : "";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${ticket.ticket_id}</td>
        <td>${senderDisplay}</td>
        <td>${ticket.subject}${broadcastBadge}</td>
        <td><span class="${getStatusClass(ticket.status)}">${ticket.status}</span></td>
        <td style="display:flex;gap:6px;align-items:center;justify-content:center;">
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

  // ─── Pagination ───────────────────────────────────────────
  function renderPagination(total, totalPages) {
    const paginationEl = document.getElementById("pagination");
    if (!paginationEl) return;
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.textContent = "‹";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => { currentPage--; renderPage(); });
    paginationEl.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
      btn.textContent = i;
      btn.addEventListener("click", () => { currentPage = i; renderPage(); });
      paginationEl.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.textContent = "›";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => { currentPage++; renderPage(); });
    paginationEl.appendChild(nextBtn);
  }

  function renderPage() {
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    renderTickets(filtered.slice(start, start + ITEMS_PER_PAGE));
    renderPagination(filtered.length, totalPages);
  }

  // ─── Delete ───────────────────────────────────────────────
  tableBody.addEventListener("click", e => {
    const btn = e.target.closest(".delete-btn");
    if (!btn) return;
    if (!confirm("האם למחוק את הפנייה?")) return;
    allTickets = allTickets.filter(t => t.ticket_id !== parseInt(btn.dataset.id));
    saveTickets(allTickets);
    renderPage();
  });

  // ─── Direction filter buttons ─────────────────────────────
  directionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      directionBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentDir = btn.dataset.dir;
      currentPage = 1;
      renderPage();
    });
  });

  if (ticketSearch) ticketSearch.addEventListener("input", () => { currentPage = 1; renderPage(); });
  if (filterInput)  filterInput.addEventListener("input",  () => { currentPage = 1; renderPage(); });

  // ─── Init ─────────────────────────────────────────────────
  seedIfEmpty();
  allTickets = getStoredTickets();
  renderPage();
});
