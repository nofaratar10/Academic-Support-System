document.addEventListener('DOMContentLoaded', () => {
    // 🎯 שליפת כל האלמנטים של חלונית הצ'אטבוט מה-HTML
    const bubble = document.getElementById('globalChatbot');
    const chatContainer = document.querySelector('.chatbot-container');
    const chatForm = document.getElementById('chatForm');
    const userMessageInput = document.getElementById('userMessage');
    const chatMessages = document.getElementById('chatMessages');

    // הכתובת של השרת המרכזי שלכן במכללה (פורט 5000)
    const API_BASE_URL = "http://vmedu473.mtacloud.co.il:5000";

    // 1. 🔘 מנגנון פתיחה וסגירה של החלונית בלחיצה על הבועה העגולה
    if (bubble && chatContainer) {
        bubble.addEventListener('click', () => {
            if (chatContainer.style.display === 'none' || chatContainer.style.display === '') {
                chatContainer.style.display = 'flex';
            } else {
                chatContainer.style.display = 'none';
            }
        });
    }
    
    // 🎯 שליפת כפתור האיקס החדש
    const closeChatBtn = document.getElementById('closeChat');

    // 3. ❌ מנגנון סגירת החלונית בלחיצה על כפתור האיקס
    if (closeChatBtn && chatContainer) {
        closeChatBtn.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
    }

    // 2. 💬 מנגנון שליחת הודעה והחזרת תשובה מ-Gemini
    if (chatForm) {
        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // מונע מהדף להתרענן בלחיצה על שלח

            const userMessage = userMessageInput.value.trim();
            if (!userMessage) return; // אם פולינה לא הקלידה כלום - אל תעשה כלום

            // הזרקת הודעת המשתמש לחלון הצ'אט
            addMessage(userMessage, 'user-message');
            userMessageInput.value = ''; // ניקוי תיבת ההקלדה

            // הצגת הודעת טעינה זמנית ("המערכת מנתחת...")
            const loadingDiv = addMessage('המערכת מנתחת את הנתונים ומכינה המלצות...', 'bot-message loading');

            try {
                // פנייה לראוט של הצאטבוט בשרת הפייתון הראשי שלכן
                const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: userMessage })
                });

                // הסרת הודעת הטעינה ברגע שהתשובה הגיעה מהשרת
                loadingDiv.remove();

                const data = await response.json();

                // אם השרת החזיר שגיאה (למשל בעיית תקשורת עם גוגל)
                if (!response.ok) {
                    addMessage(data.details || data.error || `שגיאת שרת. סטטוס: ${response.status}`, 'bot-message');
                    return;
                }

                // אם הכל עבד וה-AI החזיר תשובה מובנית
                if (data.reply) {
                    addMessage(data.reply, 'bot-message');
                }

            } catch (error) {
                // במקרה של קריסה פיזית (למשל אם השרת בכלל לא דלוק)
                if (loadingDiv) loadingDiv.remove();
                console.error('שגיאה בשליחת הבקשה:', error);
                addMessage(`שגיאה בתקשורת: לא ניתן להתחבר לשרת הפייתון. ודאי שהוא רץ מול פורט 5000.`, 'bot-message');
            }
        });
    }

    // 🧬 פונקציית עזר להזרקת בועות הודעה חדשות לתוך חלון ה-HTML
    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${className}`;
        messageDiv.innerText = text;

        chatMessages.appendChild(messageDiv);
        
        // גלילה אוטומטית של חלון הצאט תמיד למטה להודעה הכי חדשה
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }
});