(function () {
    function initChatbot() {
        // Inject bubble if not already in the page
        if (!document.getElementById('globalChatbot')) {
            const bubble = document.createElement('div');
            bubble.className = 'chatbot-bubble';
            bubble.id = 'globalChatbot';
            bubble.title = "התייעצות עם הצ'אטבוט";
            bubble.innerHTML = '<span>🤖</span>';
            document.body.appendChild(bubble);
        }

        // Inject chat popup if not already in the page
        if (!document.querySelector('.chatbot-container')) {
            const container = document.createElement('div');
            container.className = 'chatbot-container';
            container.style.display = 'none';
            container.innerHTML = `
                <div class="chat-header">
                    <h3>⚙️ עוזר AI - ליווי מילואים</h3>
                    <button type="button" class="close-chat-btn" id="closeChat">&times;</button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message bot-message">שלום פולינה, במה אוכל לסייע לך היום?</div>
                </div>
                <form class="chat-input-area" id="chatForm">
                    <input type="text" id="userMessage" placeholder="הקלידי שאלה או פרטי פנייה..." autocomplete="off" />
                    <button type="submit">שלח</button>
                </form>
            `;
            document.body.appendChild(container);
        }

        const bubble = document.getElementById('globalChatbot');
        const chatContainer = document.querySelector('.chatbot-container');
        const chatForm = document.getElementById('chatForm');
        const userMessageInput = document.getElementById('userMessage');
        const chatMessages = document.getElementById('chatMessages');
        const closeChatBtn = document.getElementById('closeChat');

        const API_BASE_URL = 'http://vmedu473.mtacloud.co.il:5000';

        bubble.addEventListener('click', () => {
            const isHidden = chatContainer.style.display === 'none' || chatContainer.style.display === '';
            chatContainer.style.display = isHidden ? 'flex' : 'none';
        });

        closeChatBtn.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });

        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const userMessage = userMessageInput.value.trim();
            if (!userMessage) return;

            addMessage(userMessage, 'user-message');
            userMessageInput.value = '';

            const loadingDiv = addMessage('המערכת מנתחת את הנתונים ומכינה המלצות...', 'bot-message loading');

            try {
                const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage })
                });

                loadingDiv.remove();
                const data = await response.json();

                if (!response.ok) {
                    addMessage(data.details || data.error || `שגיאת שרת. סטטוס: ${response.status}`, 'bot-message');
                    return;
                }

                if (data.reply) {
                    addMessage(data.reply, 'bot-message');
                }
            } catch (error) {
                if (loadingDiv) loadingDiv.remove();
                console.error('שגיאה בשליחת הבקשה:', error);
                addMessage('שגיאה בתקשורת: לא ניתן להתחבר לשרת הפייתון. ודאי שהוא רץ מול פורט 5000.', 'bot-message');
            }
        });

        function addMessage(text, className) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${className}`;
            messageDiv.innerText = text;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return messageDiv;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
