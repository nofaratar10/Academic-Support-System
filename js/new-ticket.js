document.addEventListener('DOMContentLoaded', () => {

  // ─── Toolbar B / I / U ─────────────────────────────────────
  document.querySelectorAll('.editor-toolbar button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const textarea = document.getElementById('ticketContent');
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);

      let before, after;
      const action = btn.dataset.action;
      if (action === 'bold')      { before = '**';   after = '**';   }
      else if (action === 'italic')    { before = '_';    after = '_';    }
      else if (action === 'underline') { before = '<u>';  after = '</u>'; }

      const newText =
        textarea.value.substring(0, start) +
        before + selected + after +
        textarea.value.substring(end);

      textarea.value = newText;
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd   = end   + before.length;
      textarea.focus();
    });
  });

  // ─── Elements ──────────────────────────────────────────────
  const studentName     = document.getElementById('studentName');
  const studentNameList = document.getElementById('studentNameList');
  const studentEmail    = document.getElementById('studentEmail');
  const studentEmailList= document.getElementById('studentEmailList');
  const singleFields    = document.getElementById('singleStudentFields');
  const broadcastInfo   = document.getElementById('broadcastInfo');
  const recipientCountEl= document.getElementById('recipientCount');
  const modeRadios      = document.querySelectorAll('input[name="ticketMode"]');

  // students that have a support file (תיק ליווי) AND an email — only valid recipients
  let recipients = [];

  function getMode() {
    const checked = document.querySelector('input[name="ticketMode"]:checked');
    return checked ? checked.value : 'single';
  }

  function fullName(s) {
    return `${s.first_name} ${s.last_name}`;
  }

  function findByName(name) {
    const v = (name || '').trim().toLowerCase();
    if (!v) return null;
    return recipients.find(s => fullName(s).toLowerCase() === v) || null;
  }

  function findByEmail(email) {
    const v = (email || '').trim().toLowerCase();
    if (!v) return null;
    return recipients.find(s => (s.email || '').toLowerCase() === v) || null;
  }

  // a valid single recipient = name AND email both belong to the SAME student record
  function resolveStudent() {
    const byName = findByName(studentName.value);
    const byEmail = findByEmail(studentEmail.value);
    if (byName && byEmail && byName.student_id === byEmail.student_id) return byName;
    return null;
  }

  // rebuild a datalist so suggestions appear only after ≥1 char is typed,
  // and only the entries that match what was typed
  function rebuildList(listEl, value, options) {
    listEl.innerHTML = '';
    const v = (value || '').trim().toLowerCase();
    if (!v) return; // empty field → no suggestions at all
    options
      .filter(t => t.toLowerCase().includes(v))
      .forEach(t => {
        const o = document.createElement('option');
        o.value = t;
        listEl.appendChild(o);
      });
  }

  // ─── Load students from DB ─────────────────────────────────
  fetch('/students')
    .then(res => res.json())
    .then(students => {
      // A student "has a תיק ליווי" if a support file exists for them (support_status set).
      // For both modes we only allow real DB students that have an email.
      recipients = (students || []).filter(s => s.email && s.email.trim() && s.support_status);
      recipientCountEl.textContent = recipients.length;
    })
    .catch(() => {
      recipientCountEl.textContent = 0;
    });

  // ─── Cross-fill: choosing a name fills the email, and vice-versa ───
  studentName.addEventListener('input', () => {
    rebuildList(studentNameList, studentName.value, recipients.map(fullName));
    const match = findByName(studentName.value);
    if (match) studentEmail.value = match.email;
    showError('studentName', 'studentNameError', '');
    showError('studentEmail', 'studentEmailError', '');
  });

  studentEmail.addEventListener('input', () => {
    rebuildList(studentEmailList, studentEmail.value, recipients.map(s => s.email));
    const match = findByEmail(studentEmail.value);
    if (match) studentName.value = fullName(match);
    showError('studentName', 'studentNameError', '');
    showError('studentEmail', 'studentEmailError', '');
  });

  // ─── "העתק" custom autocomplete (email on top, name below) ───
  const cc            = document.getElementById('cc');
  const ccSuggestions = document.getElementById('ccSuggestions');

  // the email currently being typed = text after the last comma
  function ccCurrentToken() {
    const val = cc.value;
    const idx = val.lastIndexOf(',');
    return (idx === -1 ? val : val.slice(idx + 1)).trim();
  }

  function closeCcSuggestions() {
    ccSuggestions.classList.remove('open');
    ccSuggestions.innerHTML = '';
  }

  // insert ONLY the chosen email, preserving previously entered addresses
  function ccApplyEmail(email) {
    const val = cc.value;
    const idx = val.lastIndexOf(',');
    const prefix = idx === -1 ? '' : val.slice(0, idx + 1) + ' ';
    cc.value = prefix + email;
    closeCcSuggestions();
    cc.focus();
  }

  function renderCcSuggestions() {
    const token = ccCurrentToken().toLowerCase();
    ccSuggestions.innerHTML = '';
    if (!token) { closeCcSuggestions(); return; }

    const matches = recipients.filter(s =>
      (s.email || '').toLowerCase().includes(token) ||
      fullName(s).toLowerCase().includes(token)
    );
    if (!matches.length) { closeCcSuggestions(); return; }

    matches.forEach(s => {
      const item = document.createElement('div');
      item.className = 'cc-suggestion-item';

      const em = document.createElement('div');
      em.className = 'cc-suggestion-email';
      em.textContent = s.email;

      const nm = document.createElement('div');
      nm.className = 'cc-suggestion-name';
      nm.textContent = fullName(s);

      item.appendChild(em);
      item.appendChild(nm);
      // mousedown (not click) so selection happens before the input's blur
      item.addEventListener('mousedown', (e) => { e.preventDefault(); ccApplyEmail(s.email); });
      ccSuggestions.appendChild(item);
    });
    ccSuggestions.classList.add('open');
  }

  if (cc && ccSuggestions) {
    cc.addEventListener('input', renderCcSuggestions);
    cc.addEventListener('focus', renderCcSuggestions);
    cc.addEventListener('blur', () => setTimeout(closeCcSuggestions, 120));
    cc.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCcSuggestions(); });
  }

  // ─── Mode toggle ───────────────────────────────────────────
  function applyMode() {
    const mode = getMode();
    if (mode === 'broadcast') {
      singleFields.style.display = 'none';
      broadcastInfo.style.display = '';
      // clear single-student selection & errors
      studentName.value = '';
      studentEmail.value = '';
      showError('studentName', 'studentNameError', '');
      showError('studentEmail', 'studentEmailError', '');
    } else {
      singleFields.style.display = '';
      broadcastInfo.style.display = 'none';
    }
  }
  modeRadios.forEach(r => r.addEventListener('change', applyMode));
  applyMode();

  // ─── Validation helpers ────────────────────────────────────
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function showError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById(errorId);
    if (!field || !err) return;
    if (message) {
      field.classList.add('input-invalid');
      err.textContent = message;
    } else {
      field.classList.remove('input-invalid');
      err.textContent = '';
    }
  }

  function validateForm() {
    const mode    = getMode();
    const subject = document.getElementById('subject').value.trim();
    const content = document.getElementById('ticketContent').value.trim();
    let valid = true;

    if (mode === 'single') {
      const nameVal  = studentName.value.trim();
      const emailVal = studentEmail.value.trim();
      const byName   = findByName(nameVal);
      const byEmail  = findByEmail(emailVal);

      // name field
      if (!nameVal) {
        showError('studentName', 'studentNameError', 'שם סטודנט הוא שדה חובה');
        valid = false;
      } else if (!byName) {
        showError('studentName', 'studentNameError', 'סטודנט בשם זה לא קיים במערכת');
        valid = false;
      } else {
        showError('studentName', 'studentNameError', '');
      }

      // email field
      if (!emailVal) {
        showError('studentEmail', 'studentEmailError', 'מייל סטודנט הוא שדה חובה');
        valid = false;
      } else if (!byEmail) {
        showError('studentEmail', 'studentEmailError', 'מייל זה לא קיים במערכת');
        valid = false;
      } else {
        showError('studentEmail', 'studentEmailError', '');
      }

      // name + email must belong to the SAME student record
      if (byName && byEmail && byName.student_id !== byEmail.student_id) {
        showError('studentEmail', 'studentEmailError', 'השם והמייל אינם שייכים לאותו סטודנט');
        valid = false;
      }
    } else {
      // broadcast: must have at least one recipient with a DB email
      if (!recipients.length) {
        alert('אין סטודנטים עם תיק ליווי ומייל שמור לשליחת תפוצה.');
        valid = false;
      }
    }

    if (!subject) {
      showError('subject', 'subjectError', 'נושא הוא שדה חובה');
      valid = false;
    } else {
      showError('subject', 'subjectError', '');
    }

    if (!content) {
      showError('ticketContent', 'contentError', 'תוכן הפנייה הוא שדה חובה');
      valid = false;
    } else {
      showError('ticketContent', 'contentError', '');
    }

    // העתק — אופציונלי, מיילים נוספים מופרדים בפסיקים
    const cc = document.getElementById('cc').value.trim();
    if (cc) {
      const bad = cc.split(',').map(s => s.trim()).filter(Boolean).filter(e => !isValidEmail(e));
      if (bad.length) {
        showError('cc', 'ccError', 'כתובת מייל אינה תקינה בשדה העתק');
        valid = false;
      } else {
        showError('cc', 'ccError', '');
      }
    } else {
      showError('cc', 'ccError', '');
    }

    return valid;
  }

  // ─── Storage helpers ───────────────────────────────────────
  const STORAGE_KEY = "tickets_data";
  const URGENT_KEYWORDS = ["דחוף", "היום", "מחר", "מבחן", "הגשה", "התאמות", "מילואים", "אישור", "לא מצליח"];

  function computeUrgency(subject, content) {
    const text = `${subject || ""} ${content || ""}`;
    return URGENT_KEYWORDS.some(kw => text.includes(kw)) ? "דחוף" : "רגיל";
  }

  function getStoredTickets() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function nextTicketId(existing) {
    return existing.length ? Math.max(...existing.map(t => t.ticket_id)) + 1 : 1;
  }

  // ─── Form submit ───────────────────────────────────────────
  const ticketForm = document.getElementById('newTicketForm');
  if (!ticketForm) return;

  ticketForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const mode    = getMode();
    const subject = document.getElementById('subject').value.trim();
    const content = document.getElementById('ticketContent').value.trim();
    const cc      = document.getElementById('cc').value;

    const existing = getStoredTickets();
    const ticketId = nextTicketId(existing);

    let ticket;

    if (mode === 'broadcast') {
      // confirmation before sending to everyone
      if (!confirm(`האם לשלוח את ההודעה לכל ${recipients.length} הסטודנטים עם תיק ליווי?`)) {
        return;
      }

      ticket = {
        ticket_id: ticketId,
        subject,
        content,
        recipient: "כל הסטודנטים עם תיק ליווי",
        recipientsCount: recipients.length,
        recipientEmails: recipients.map(s => s.email),
        broadcast: true,
        type: "תפוצה",
        student_id: null,
        sender_name: "פולינה (רכזת)",
        cc: cc || null,
        direction: "outgoing",
        status: "ממתין",
        urgency: computeUrgency(subject, content),
        created_at: new Date().toISOString(),
        messages: []
      };
    } else {
      const match = resolveStudent();
      ticket = {
        ticket_id: ticketId,
        subject,
        content,
        recipient: `${match.first_name} ${match.last_name}`,
        recipientEmail: match.email,
        broadcast: false,
        student_id: match.student_id,
        sender_name: "פולינה (רכזת)",
        cc: cc || null,
        direction: "outgoing",
        status: "ממתין",
        urgency: computeUrgency(subject, content),
        created_at: new Date().toISOString(),
        messages: []
      };
    }

    existing.unshift(ticket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    if (mode === 'broadcast') {
      alert(`ההודעה נשלחה ל-${recipients.length} סטודנטים עם תיק ליווי.`);
    }

    window.location.href = `/view-ticket?id=${ticketId}`;
  });
});
