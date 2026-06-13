document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "tickets_data";
  const SENDER_ME = "פולינה (רכזת)";

  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = parseInt(urlParams.get("id"));

  // ─── Storage helpers ──────────────────────────────────────
  function getTickets() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveTickets(tickets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }

  function getTicket() {
    return getTickets().find(t => t.ticket_id === ticketId) || null;
  }

  function updateTicket(updated) {
    const tickets = getTickets().map(t => t.ticket_id === ticketId ? updated : t);
    saveTickets(tickets);
  }

  // ─── Status / Urgency styling ─────────────────────────────
  function getStatusClass(status) {
    if (status === "חדש")    return "status-pill status-open";
    if (status === "בטיפול") return "status-pill status-progress";
    if (status === "ממתין")  return "status-pill status-pending";
    if (status === "נסגר")   return "status-pill status-closed";
    return "status-pill status-pending";
  }

  // ─── Date formatting ──────────────────────────────────────
  function formatDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  }

  // ─── Render ───────────────────────────────────────────────
  function renderTicket(ticket) {
    const fromName = ticket.direction === "incoming"
      ? (ticket.sender_name || ticket.recipient)
      : SENDER_ME;
    let toName = ticket.direction === "incoming"
      ? SENDER_ME
      : ticket.recipient;
    if (ticket.broadcast) {
      toName = `${ticket.recipient} (${ticket.recipientsCount} נמענים)`;
    }

    document.getElementById("ticketSubject").textContent = ticket.subject;

    const statusEl = document.getElementById("ticketStatus");
    statusEl.textContent = ticket.status;
    statusEl.className = getStatusClass(ticket.status);

    const fromEl = document.getElementById("ticketFrom");
    if (fromEl) fromEl.textContent = fromName;

    const toEl = document.getElementById("ticketTo");
    if (toEl) toEl.textContent = toName;

    const dateEl = document.getElementById("ticketDate");
    if (dateEl) dateEl.textContent = formatDate(ticket.created_at);

    const closeBtn = document.getElementById("closeTicketBtn");
    if (closeBtn) {
      if (ticket.status === "נסגר") {
        closeBtn.disabled = true;
        closeBtn.textContent = "הפנייה נסגרה";
      } else {
        closeBtn.disabled = false;
        closeBtn.textContent = "סגור פנייה";
      }
    }
  }

  function renderMessages(ticket) {
    const container = document.getElementById("ticketMessagesContainer");
    if (!container) return;
    container.innerHTML = "";

    // Original message as first card with correct direction styling
    const isOriginalOutgoing = ticket.direction === "outgoing";
    const originalSender = isOriginalOutgoing
      ? SENDER_ME
      : (ticket.sender_name || ticket.recipient);

    const originalDiv = document.createElement("div");
    originalDiv.className = `message-card ${isOriginalOutgoing ? "outgoing" : "incoming"}`;
    originalDiv.innerHTML = `
      <div class="message-meta">
        <span class="timestamp">${formatDate(ticket.created_at)}</span>
        <div class="sender-info"><strong>מאת:</strong> ${originalSender}</div>
      </div>
      <div class="message-body">${(ticket.content || "").replace(/\n/g, "<br>")}</div>
    `;
    container.appendChild(originalDiv);

    // Replies
    (ticket.messages || []).forEach(msg => {
      const isOutgoing = msg.sender === SENDER_ME;
      const div = document.createElement("div");
      div.className = `message-card ${isOutgoing ? "outgoing" : "incoming"}`;
      div.innerHTML = `
        <div class="message-meta">
          <span class="timestamp">${msg.created_at || ""}</span>
          <div class="sender-info"><strong>מאת:</strong> ${msg.sender}</div>
        </div>
        <div class="message-body">${(msg.content || "").replace(/\n/g, "<br>")}</div>
      `;
      container.appendChild(div);
    });
  }

  function loadAndRender() {
    const ticket = getTicket();
    if (!ticket) {
      window.location.href = "/tickets";
      return;
    }

    // Auto-advance from "חדש" to "בטיפול" only for incoming tickets
    if (ticket.status === "חדש" && ticket.direction === "incoming") {
      ticket.status = "בטיפול";
      updateTicket(ticket);
    }

    renderTicket(ticket);
    renderMessages(ticket);
  }

  // ─── Send reply ───────────────────────────────────────────
  const sendReplyBtn = document.getElementById("sendReplyBtn");
  const replyContent = document.getElementById("replyContent");

  if (sendReplyBtn) {
    sendReplyBtn.addEventListener("click", () => {
      const content = (replyContent?.value || "").trim();
      if (!content) return;

      const ticket = getTicket();
      if (!ticket) return;

      ticket.messages = ticket.messages || [];
      ticket.messages.push({
        sender: SENDER_ME,
        content,
        created_at: new Date().toLocaleString("he-IL")
      });

      if (ticket.status !== "נסגר") ticket.status = "ממתין";

      updateTicket(ticket);
      replyContent.value = "";
      loadAndRender();
    });
  }

  // ─── Close ticket ─────────────────────────────────────────
  const closeBtn = document.getElementById("closeTicketBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const ticket = getTicket();
      if (!ticket || ticket.status === "נסגר") return;
      if (!confirm("לסמן את הפנייה כנסגרה?")) return;
      ticket.status = "נסגר";
      updateTicket(ticket);
      loadAndRender();
    });
  }

  loadAndRender();
});
