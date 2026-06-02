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

  // ─── Validation helpers ────────────────────────────────────
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function showError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const err   = document.getElementById(errorId);
    if (message) {
      field.classList.add('input-invalid');
      err.textContent = message;
    } else {
      field.classList.remove('input-invalid');
      err.textContent = '';
    }
  }

  function validateForm() {
    const studentName  = document.getElementById('studentName').value.trim();
    const studentEmail = document.getElementById('studentEmail').value.trim();
    const subject      = document.getElementById('subject').value.trim();
    const content      = document.getElementById('ticketContent').value.trim();

    let valid = true;

    if (!studentName) {
      showError('studentName', 'studentNameError', 'שם סטודנט הוא שדה חובה');
      valid = false;
    } else {
      showError('studentName', 'studentNameError', '');
    }

    if (!studentEmail) {
      showError('studentEmail', 'studentEmailError', 'מייל הוא שדה חובה');
      valid = false;
    } else if (!isValidEmail(studentEmail)) {
      showError('studentEmail', 'studentEmailError', 'כתובת מייל אינה תקינה');
      valid = false;
    } else {
      showError('studentEmail', 'studentEmailError', '');
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

    return valid;
  }

  // ─── Form submit ───────────────────────────────────────────
  const ticketForm = document.getElementById('newTicketForm');
  if (!ticketForm) return;

  ticketForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const studentName  = document.getElementById('studentName').value.trim();
    const studentEmail = document.getElementById('studentEmail').value.trim();
    const subject      = document.getElementById('subject').value.trim();
    const content      = document.getElementById('ticketContent').value.trim();
    const cc           = document.getElementById('cc').value;

    const formData = {
      sender_name: "פולינה (רכזת)",
      recipient: studentName,
      cc: cc || null,
      subject,
      content,
      direction: "outgoing",
      status: "נשלח"
    };

    const submitBtn = ticketForm.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'שולח...';

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const ticket = await response.json();
        window.location.href = `/view-ticket?id=${ticket.ticket_id}`;
      } else {
        throw new Error('שגיאה בשליחת הפנייה');
      }
    } catch (error) {
      console.error("Error:", error);
      alert('חלה שגיאה בחיבור לשרת');
      submitBtn.disabled = false;
      submitBtn.textContent = 'שליחת פנייה';
    }
  });
});
