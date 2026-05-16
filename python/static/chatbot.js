document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const userMessageInput = document.getElementById('userMessage');
    const chatMessages = document.getElementById('chatMessages');


    const bubble = document.getElementById('globalChatbot');
    const chatContainer = document.querySelector('.chatbot-container');
    if (bubble && chatContainer) {
            bubble.addEventListener('click', () => {
                // בודק אם החלונית מוצגת. אם כן - מסתיר, אם לא - מציג.
                if (chatContainer.style.display === 'none' || chatContainer.style.display === '') {
                    chatContainer.style.display = 'flex';
                } else {
                    chatContainer.style.display = 'none';
                }
            });
        }

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

                if (data.reply) {
                    addMessage(data.reply, 'bot-message');
                }

            } catch (error) {
                console.error('שגיאה בשליחת הבקשה:', error);
                addMessage(`שגיאה: ${error.message}`, 'bot-message'); // show actual error
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