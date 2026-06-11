// api.js - Standalone AI services calling the FastAPI Backend

const BACKEND_BASE_URL = 'https://nui-ba-den-travel-assistant-backend.onrender.com';

export const apiService = {
    /**
     * Sends message to the AI RAG Chatbot API
     */
    async sendMessage(userHistory, newMessage) {
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
                language: 'vi',
                conversation_history: formattedHistory
            })
        });

        if (!response.ok) throw new Error("API Connection Failed");
        const data = await response.json();
        return data.answer || "Tôi đang gặp chút sự cố kết nối. Anh/Chị vui lòng thử lại sau giây lát ạ!";
    },

    /**
     * Generates a structured itinerary via AI
     */
    async generateItinerary(request) {
        const response = await fetch(`${BACKEND_BASE_URL}/api/chat/itinerary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                request: request
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error("Lỗi kết nối API: " + response.status);
        }

        const data = await response.json();
        if (!data.steps || !Array.isArray(data.steps)) {
            throw new Error("Dữ liệu lịch trình không hợp lệ.");
        }

        return data;
    }
};
