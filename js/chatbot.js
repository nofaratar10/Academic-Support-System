document.addEventListener('DOMContentLoaded', () => {
    const chatbotBtn = document.getElementById('globalChatbot');
    
    if (chatbotBtn) {
        chatbotBtn.addEventListener('click', () => {
            // כאן תבוא האינטגרציה עם הקוד של החברה שאחראית על הצ'אט
            console.log("צ'אטבוט הופעל");
            alert('התייעצות עם ה-AI בדרך...');
        });
    }
});