const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get('id');

const messagesContainer = document.getElementById('messagesContainer');
const sendReplyBtn = document.getElementById('sendReplyBtn');
const replyContent = document.getElementById('replyContent');

const SENDER_ME = 'פולינה (רכזת)';

function getStatusClass(status) {
  if (status === 'חדש') return 'status-pill new';
  if (status === 'ממתין') return 'status-pill waiting';
  if (status === 'דחוף') return 'status-pill urgent';
  if (status === 'בטיפול') return 'status-pill status-progress';
  if (status === 'סגור') return 'status-pill status-closed';
  return 'status-pill';
}

function renderMessage(msg) {
  const isOutgoing = msg.sender === SENDER_ME;
  const div = document.createElement('div');
  div.className = `message-card ${isOutgoing ? 'outgoing' : 'incoming'}`;
  div.innerHTML = `
    <div class="message-meta">
      <span class="timestamp">${msg.created_at || ''}</span>
      <div class="sender-info">
        <strong>מאת:</strong> ${msg.sender}
      </div>
    </div>
    <div class="message-body">${msg.content.replace(/\n/g, '<br>')}</div>
  `;
  return div;
}

async function loadTicket() {
  if (!ticketId) {
    window.location.href = '/tickets';
    return;
  }

  try {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (!res.ok) throw new Error('לא נמצאה פנייה');
    const ticket = await res.json();

    document.getElementById('ticketSubject').textContent = ticket.subject;
    const statusEl = document.getElementById('ticketStatus');
    statusEl.textContent = ticket.status;
    statusEl.className = getStatusClass(ticket.status);

  } catch (err) {
    console.error(err);
    document.getElementById('ticketSubject').textContent = 'שגיאה בטעינת הפנייה';
  }
}

async function loadMessages() {
  try {
    const res = await fetch(`/api/tickets/${ticketId}/messages`);
    if (!res.ok) throw new Error();
    const messages = await res.json();

    messagesContainer.innerHTML = '';
    if (!messages.length) {
      messagesContainer.innerHTML = '<p style="text-align:center;color:#888;">אין הודעות עדיין</p>';
      return;
    }
    messages.forEach(msg => messagesContainer.appendChild(renderMessage(msg)));

  } catch (err) {
    console.error(err);
    messagesContainer.innerHTML = '<p>שגיאה בטעינת ההודעות</p>';
  }
}

async function sendReply() {
  const content = replyContent.value.trim();
  if (!content) return;

  sendReplyBtn.disabled = true;
  sendReplyBtn.textContent = 'שולח...';

  try {
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: SENDER_ME, content })
    });

    if (!res.ok) throw new Error();

    replyContent.value = '';
    await loadMessages();
    await loadTicket(); // לעדכן סטטוס

  } catch (err) {
    console.error(err);
    alert('שגיאה בשליחת התגובה');
  } finally {
    sendReplyBtn.disabled = false;
    sendReplyBtn.textContent = 'שליחה';
  }
}

sendReplyBtn.addEventListener('click', sendReply);

loadTicket();
loadMessages();