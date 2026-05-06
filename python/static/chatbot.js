document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userMessageInput = document.getElementById('userMessage');
    const chatMessages = document.getElementById('chatMessages');

    if (chatForm) {
        chatForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const userMessage = userMessageInput.value.trim();

            if (!userMessage) {
                return;
            }

            addMessage(userMessage, 'user-message');
            userMessageInput.value = '';

            try {
                const response = await fetch('/chatbot/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message: userMessage })
                });

                const responseText = await response.text();
                console.log("Raw response from server:", responseText);

                let data;

                try {
                    data = JSON.parse(responseText);
                } catch (jsonError) {
                    addMessage(
                        `השרת לא החזיר JSON תקין. סטטוס: ${response.status}. בדקי את הקונסול של PyCharm.`,
                        'bot-message'
                    );
                    return;
                }

                if (!response.ok) {
                    addMessage(
                        data.details || data.error || `שגיאת שרת. סטטוס: ${response.status}`,
                        'bot-message'
                    );
                    return;
                }

                addMessage(data.answer, 'bot-message');

            } catch (error) {
                console.error('שגיאה בשליחת הבקשה:', error);
                addMessage('אירעה שגיאה בחיבור לשרת. בדקי שהשרת Flask עדיין רץ.', 'bot-message');
            }
        });
    }

    function addMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', className);
        messageDiv.innerText = text;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});