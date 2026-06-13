(function () {
    const ACTIONS = [
        { id: 'reply',   label: 'ניסוח תגובה לסטודנט',  hint: 'הדביקי את תוכן הפנייה או תארי את המצב:' },
        { id: 'steps',   label: 'המלצה לצעדי טיפול',     hint: 'הדביקי את תוכן הפנייה או תארי את המצב:' },
        { id: 'summary', label: 'סיכום פנייה',            hint: 'הדביקי את תוכן הפנייה לסיכום:' },
        { id: 'tasks',   label: 'בניית משימות להמשך',    hint: 'הדביקי את תוכן הפנייה או תארי את המצב:' },
        { id: 'free',    label: 'הודעה חופשית',           hint: 'כתבי את שאלתך:' },
    ];

    function getTicketContext() {
        if (!window.location.pathname.includes('view-ticket')) return null;
        const id = parseInt(new URLSearchParams(window.location.search).get('id'));
        if (!id) return null;
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets_data') || '[]');
            const t = tickets.find(t => t.ticket_id === id);
            if (!t) return null;
            return {
                ticket_id: t.ticket_id,
                subject:   t.subject  || '',
                sender:    t.direction === 'incoming' ? (t.sender_name || t.recipient) : 'פולינה (רכזת)',
                content:   t.content  || '',
                status:    t.status   || '',
            };
        } catch { return null; }
    }

    function initChatbot() {
        if (!document.getElementById('globalChatbot')) {
            const bubble = document.createElement('div');
            bubble.className = 'chatbot-bubble';
            bubble.id = 'globalChatbot';
            bubble.title = "התייעצות עם הצ'אטבוט";
            bubble.innerHTML = '<span>🤖</span>';
            document.body.appendChild(bubble);
        }

        if (!document.querySelector('.chatbot-container')) {
            const container = document.createElement('div');
            container.className = 'chatbot-container';
            container.style.display = 'none';
            container.innerHTML = `
                <div class="chat-header">
                    <h3>⚙️ עוזר AI - ליווי מילואים</h3>
                    <button type="button" class="close-chat-btn" id="closeChat">&times;</button>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <form class="chat-input-area" id="chatForm">
                    <input type="text" id="userMessage" placeholder="בחרי פעולה למעלה..." autocomplete="off" disabled />
                    <button type="submit" disabled>שלח</button>
                </form>
            `;
            document.body.appendChild(container);
        }

        const bubble        = document.getElementById('globalChatbot');
        const chatContainer = document.querySelector('.chatbot-container');
        const chatForm      = document.getElementById('chatForm');
        const input         = document.getElementById('userMessage');
        const chatMessages  = document.getElementById('chatMessages');
        const closeBtn      = document.getElementById('closeChat');
        const submitBtn     = chatForm.querySelector('button[type="submit"]');

        const API_BASE_URL = window.location.origin;

        let selectedAction  = null;
        let ticketContext   = null;
        let initialized     = false;

        // ─── helpers ──────────────────────────────────────────
        function addMessage(text, cls) {
            const div = document.createElement('div');
            div.className = `message ${cls}`;
            div.innerText = text;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return div;
        }

        function enableInput(placeholder) {
            input.disabled   = false;
            submitBtn.disabled = false;
            input.placeholder = placeholder;
            input.focus();
        }

        function disableInput() {
            input.disabled    = true;
            submitBtn.disabled = true;
            input.value       = '';
            input.placeholder = 'בחרי פעולה למעלה...';
        }

        // ─── action buttons ───────────────────────────────────
        function showActionButtons() {
            const wrap = document.createElement('div');
            wrap.className = 'chatbot-actions';
            wrap.id = 'chatbotActions';
            ACTIONS.forEach(action => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chatbot-action-btn';
                btn.textContent = action.label;
                btn.addEventListener('click', () => onActionSelected(action));
                wrap.appendChild(btn);
            });
            chatMessages.appendChild(wrap);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function removeActionButtons() {
            const el = document.getElementById('chatbotActions');
            if (el) el.remove();
        }

        // ─── send to AI ───────────────────────────────────────
        async function sendToAI(userMessage, retryCount = 0) {
            disableInput();
            const loadingDiv = addMessage(
                retryCount > 0 ? 'מנסה שוב...' : 'המערכת מנתחת ומכינה תשובה...',
                'bot-message loading'
            );

            try {
                const res = await fetch(`${API_BASE_URL}/chatbot/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message:        userMessage,
                        action:         selectedAction,
                        ticket_context: ticketContext
                    })
                });

                loadingDiv.remove();

                // retry once on 503
                if (res.status === 503 && retryCount < 1) {
                    const waitDiv = addMessage('השירות עמוס, מנסה שוב בעוד 3 שניות...', 'bot-message loading');
                    await new Promise(r => setTimeout(r, 3000));
                    waitDiv.remove();
                    return sendToAI(userMessage, retryCount + 1);
                }

                const data = await res.json();

                if (!res.ok) {
                    const msg = res.status === 503
                        ? 'השירות לא זמין כרגע, נסי שוב בעוד רגע.'
                        : 'שגיאה בשירות ה-AI, נסי שוב.';
                    addMessage(msg, 'bot-message');
                } else if (data.reply) {
                    addMessage(data.reply, 'bot-message');
                }
            } catch {
                if (loadingDiv.parentNode) loadingDiv.remove();
                addMessage('שגיאה בתקשורת עם השרת. ודאי שהשרת פעיל.', 'bot-message');
            }

            enableInput('שאלה נוספת או הערה...');
        }

        // ─── select action ────────────────────────────────────
        function onActionSelected(action) {
            selectedAction = action.id;
            removeActionButtons();
            addMessage(`בחרת: ${action.label}`, 'user-message');

            ticketContext = getTicketContext();

            if (ticketContext && action.id !== 'free') {
                // שלח מיד לגמיני עם תוכן הפנייה — ללא המתנה למשתמשת
                sendToAI('');
            } else {
                addMessage(action.hint, 'bot-message');
                enableInput(action.id === 'free' ? 'כתבי את שאלתך...' : 'הדביקי תוכן פנייה או תארי את המצב...');
            }
        }

        // ─── reset ────────────────────────────────────────────
        function resetChat() {
            chatMessages.innerHTML = '';
            selectedAction  = null;
            ticketContext   = null;
            disableInput();
            addMessage('שלום פולינה, במה אוכל לסייע לך היום?', 'bot-message');
            showActionButtons();
        }

        // ─── open / close ─────────────────────────────────────
        bubble.addEventListener('click', () => {
            const hidden = chatContainer.style.display === 'none' || chatContainer.style.display === '';
            chatContainer.style.display = hidden ? 'flex' : 'none';
            if (hidden && !initialized) {
                initialized = true;
                resetChat();
            }
        });

        closeBtn.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });

        // ─── submit ───────────────────────────────────────────
        chatForm.addEventListener('submit', async e => {
            e.preventDefault();
            const userMessage = input.value.trim();

            if (!selectedAction) return;

            const hasTicket = ticketContext && selectedAction !== 'free';
            if (!userMessage && !hasTicket) {
                addMessage('יש להזין תוכן לפני השליחה.', 'bot-message');
                return;
            }

            addMessage(userMessage, 'user-message');
            input.value = '';
            await sendToAI(userMessage);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})();
