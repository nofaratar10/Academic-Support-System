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
        // כאן אפשר להוסיף הפניה חזרה לרשימת הפניות אם אין ID
    }
});

/**
 * פונקציה למשיכת נתוני הפנייה וההודעות מהשרת
 * תפקיד שי: לחבר ל-API של נופר ולהציג את הנתונים
 */
async function loadTicketData(id) {
    try {
        // הכתובת של השרת לפי ה-Backend של נופר
        const response = await fetch(`http://vmedu473.mtacloud.co.il:5000/tickets/${id}`);
        
        if (!response.ok) {
            throw new Error('לא ניתן היה למשוך את נתוני הפנייה מהשרת');
        }

        const ticketData = await response.json();
        
        // כאן תבוא הפונקציה שתבני בהמשך כדי לרנדר את ההודעות למסך
        renderTicketDetails(ticketData); 
        
        console.log("נתוני פנייה נטענו בהצלחה:", ticketData);
    } catch (error) {
        console.error("שגיאה בטעינת נתוני הפנייה:", error);
    }
}

/**
 * פונקציה לעדכון ה-UI עם הנתונים שהתקבלו
 */
function renderTicketDetails(data) {
    // עדכון כותרת הפנייה והסטטוס בדף
    const subjectElem = document.getElementById('ticketSubject');
    const statusElem = document.getElementById('ticketStatus');
    
    if (subjectElem) subjectElem.textContent = data.subject || "נושא לא ידוע";
    if (statusElem) statusElem.textContent = data.status || "בטיפול";
    
    // בהמשך: לולאה שבונה את כרטיסי ההודעות (message-card) לתוך ה-container
}