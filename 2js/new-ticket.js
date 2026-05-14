document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('newTicketForm');

    if (ticketForm) {
        ticketForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // מונע מהדף להתרענן סתם

            // איסוף הנתונים מהטופס
            const formData = {
                recipient: document.getElementById('recipient').value,
                cc: document.getElementById('cc').value,
                subject: document.getElementById('subject').value,
                content: document.getElementById('ticketContent').value,
                timestamp: new Date().toLocaleString('he-IL')
            };

            console.log("שולח פנייה חדשה:", formData);

            try {
                // חיבור ל-API של נופר - שליחת הנתונים לשרת
                const response = await fetch('http://vmedu473.mtacloud.co.il:5000/tickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                if (response.ok) {
                    alert('הפנייה נשלחה בהצלחה!');
                    window.location.href = 'tickets.html'; // חזרה לרשימת הפניות
                } else {
                    throw new Error('שגיאה בשליחת הפנייה');
                }
            } catch (error) {
                console.error("Error:", error);
                alert('חלה שגיאה בחיבור לשרת. ודאי שה-Backend רץ.');
            }
        });
    }
});