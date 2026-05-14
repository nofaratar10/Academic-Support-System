document.addEventListener('DOMContentLoaded', () => {
    // 1. חילוץ ה-ID של הפנייה מה-URL
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');

    // 2. בדיקה אם קיים ID וטעינת הנתונים בהתאם
    if (ticketId) {
        console.log("טוען נתונים עבור פנייה מספר:", ticketId);
        loadTicketData(ticketId);
    } else {
        console.warn("לא נמצא ID של פנייה בכתובת ה-URL");
        // נשאיר את הודעות הדמו הקיימות ב-HTML אם אין ID בכתובת
    }

    // 3. האזנה לשליחת טופס התגובה החדש
    const replyForm = document.getElementById('replyForm');
    if (replyForm) {
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // מונע מהדף להתרענן

            const replyContentInput = document.getElementById('replyContent');
            if (!ticketId || !replyContentInput) return;

            const content = replyContentInput.value.trim();
            if (!content) return;

            // הכנת הנתונים לשליחה לנופר
            const replyData = {
                ticket_id: ticketId,
                content: content,
                sender_role: 'coordinator', // פולינה הרכזת שולחת
                sender_name: 'פולינה (רכזת)',
                recipient_name: document.getElementById('ticketSubject')?.innerText || 'סטודנט',
                timestamp: new Date().toLocaleString('he-IL', { hour12: false })
            };

            try {
                // שינוי מצב כפתור השליחה לטעינה
                const submitBtn = replyForm.querySelector('.send-reply-btn');
                submitBtn.innerText = 'שולח...';
                submitBtn.disabled = true;

                // שליחת התגובה החדשה ל-API של נופר
                const response = await fetch(`http://vmedu473.mtacloud.co.il:5000/tickets/${ticketId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(replyData),
                });

                if (!response.ok) {
                    throw new Error('שגיאה בשליחת התגובה לשרת');
                }

                // ריקון תיבת הטקסט במידה והשליחה הצליחה
                replyContentInput.value = '';

                // טעינה מחדש של השיחה כדי להציג את ההודעה החדשה
                await loadTicketData(ticketId);

            } catch (error) {
                console.error("Error sending reply:", error);
                alert('חלה שגיאה בשליחת התגובה. ודאי שהשרת של נופר פעיל.');
            } finally {
                // החזרת הכפתור למצב רגיל
                const submitBtn = replyForm.querySelector('.send-reply-btn');
                submitBtn.innerText = 'שליחת תגובה';
                submitBtn.disabled = false;
            }
        });
    }
});

/**
 * פונקציה למשיכת נתוני הפנייה וההודעות מהשרת
 */
async function loadTicketData(id) {
    try {
        const response = await fetch(`http://vmedu473.mtacloud.co.il:5000/tickets/${id}`);
        
        if (!response.ok) {
            throw new Error('לא ניתן היה למשוך את נתוני הפנייה מהשרת');
        }

        const ticketData = await response.json();
        
        // עדכון פרטי כותרת הפנייה והסטטוס רק כשיש נתונים אמיתיים
        const idHeaderEl = document.getElementById('ticketIdHeader');
        if (idHeaderEl) {
            idHeaderEl.innerText = `#${id}`;
        }

        const subjectEl = document.getElementById('ticketSubject');
        if (subjectEl && ticketData.subject) {
            subjectEl.innerText = ticketData.subject;
        }

        const statusEl = document.getElementById('ticketStatus');
        if (statusEl && ticketData.status) {
            statusEl.innerText = ticketData.status;
            statusEl.style.display = 'inline-block'; // הצגת הסטטוס
        }

        // קריאה לפונקציה שמרנדרת את ההודעות
        if (ticketData.messages) {
            renderTicketMessages(ticketData.messages); 
        }
        
        console.log("נתוני פנייה נטענו בהצלחה:", ticketData);
    } catch (error) {
        console.error("שגיאה בטעינת נתוני הפנייה:", error);
        // במקרה של שגיאה, לא נדרוס את הודעות הדמו מה-HTML כדי שהנראות לא תיפגע
    }
}

/**
 * פונקציה שמייצרת את בועות השיחה על המסך
 */
function renderTicketMessages(messages) {
    const container = document.getElementById('ticketMessagesContainer');
    if (!container) return;
    if (!messages || !Array.isArray(messages) || messages.length === 0) return;

    // ניקוי הודעות הדמו רק כשיש הודעות אמיתיות
    container.innerHTML = '';

    messages.forEach(msg => {
        const messageCard = document.createElement('div');
        
        // הגדרת כיוון הבועה (סטודנט = incoming [ימין], רכזת = outgoing [שמאל])
        const isIncoming = msg.sender_role === 'student';
        messageCard.className = `message-card ${isIncoming ? 'incoming' : 'outgoing'}`;

        messageCard.innerHTML = `
            <div class="message-meta">
                <span class="timestamp">${msg.timestamp}</span>
                <div class="sender-info">
                    <strong>מאת:</strong> ${msg.sender_name} <br>
                    <strong>אל:</strong> ${msg.recipient_name}
                </div>
            </div>
            <div class="message-body">
                ${msg.content.replace(/\n/g, '<br>')}
            </div>
        `;
        
        container.appendChild(messageCard);
    });
}