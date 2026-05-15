document.addEventListener('DOMContentLoaded', () => {
    // קריאה לפונקציה שטוענת את הנתונים ברגע שהדף מוכן
    fetchTickets();
});

async function fetchTickets() {
    const tableBody = document.querySelector('.tickets-table tbody');
    
    try {
        // 1. פנייה ל-API לקבלת כל הפניות
        const response = await fetch('http://vmedu473.mtacloud.co.il:5000/tickets');
        
        if (!response.ok) {
            throw new Error('שגיאה במשיכת הפניות מהשרת');
        }

        const tickets = await response.json();
        
        // 2. ניקוי הטבלה מהשורות הסטטיות (יוסי כהן וכו')
        tableBody.innerHTML = '';

        // 3. מעבר על כל פנייה ויצירת שורה בטבלה
        tickets.forEach(ticket => {
            const row = document.createElement('tr');
            
            // התאמת צבע ה"בועה" לפי הסטטוס
            const statusClass = getStatusClass(ticket.status);
            const statusHebrew = translateStatus(ticket.status);

            row.innerHTML = `
                <td>${ticket.id || ticket.ticket_id}</td>
                <td>${ticket.student_name || 'סטודנט כללי'}</td>
                <td>${ticket.subject}</td>
                <td><span class="status-pill ${statusClass}">${statusHebrew}</span></td>
                <td><button class="action-btn" onclick="openTicket(${ticket.id || ticket.ticket_id})">פתיחה</button></td>
            `;
            
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">חלה שגיאה בטעינת הנתונים. וודאי שהשרת של נופר רץ.</td></tr>';
    }
}

// פונקציית עזר לפתיחת פנייה ספציפית
function openTicket(id) {
    // מעבר לדף הפרטים עם ה-ID של הפנייה בכתובת
    window.location.href = `view-ticket.html?id=${id}`;
}

// עזר לעיצוב הסטטוסים
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'new': return 'new';
        case 'pending': return 'waiting';
        case 'urgent': return 'urgent';
        case 'closed': return 'closed';
        default: return 'new';
    }
}

// עזר לתרגום הסטטוס לעברית
function translateStatus(status) {
    const statuses = {
        'new': 'חדש',
        'pending': 'ממתין',
        'urgent': 'דחוף',
        'closed': 'סגור'
    };
    return statuses[status?.toLowerCase()] || status;
}