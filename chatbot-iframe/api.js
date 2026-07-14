// api.js - Standalone AI services calling the FastAPI Backend

const BACKEND_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : ''; // Rỗng để sử dụng Proxy /api/* của Netlify ở Production

export const apiService = {
    /**
     * Sends message to the AI RAG Chatbot API
     */
    async sendMessage(userHistory, newMessage, language = 'auto') {
        // Map history to backend format
        const formattedHistory = userHistory.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text
        }));

        const response = await fetch(`${BACKEND_BASE_URL}/api/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: newMessage,
                channel: 'web_iframe',
                language: language,
                conversation_history: formattedHistory
            })
        });

        if (!response.ok) throw new Error("API Connection Failed");
        const data = await response.json();
        return data.answer || "Tôi đang gặp chút sự cố kết nối. Anh/Chị vui lòng thử lại sau giây lát ạ!";
    }
};
