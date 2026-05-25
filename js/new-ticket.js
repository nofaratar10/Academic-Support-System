document.addEventListener('DOMContentLoaded', async () => {

  // טעינת רשימת סטודנטים מה-DB
  const recipientSelect = document.getElementById('recipient');
  try {
    const res = await fetch('/students');
    const students = await res.json();
    students.forEach(s => {
      const option = document.createElement('option');
      option.value = s.student_id;
      option.textContent = `${s.first_name} ${s.last_name} (סטודנט)`;
      option.dataset.name = `${s.first_name} ${s.last_name}`;
      recipientSelect.appendChild(option);
    });
  } catch (err) {
    console.error('שגיאה בטעינת סטודנטים:', err);
  }

  // שליחת פנייה
  const ticketForm = document.getElementById('newTicketForm');
  if (ticketForm) {
    ticketForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const selectedOption = recipientSelect.options[recipientSelect.selectedIndex];
      const studentId = parseInt(recipientSelect.value) || null;
      const recipientName = selectedOption?.dataset?.name || selectedOption?.textContent || recipientSelect.value;

      const formData = {
        student_id: studentId,
        sender_name: "פולינה (רכזת)",
        recipient: recipientName,
        cc: document.getElementById('cc').value,
        subject: document.getElementById('subject').value,
        content: document.getElementById('ticketContent').value,
        direction: "outgoing",
        status: "נשלח"
      };

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
      }
    });
  }
});