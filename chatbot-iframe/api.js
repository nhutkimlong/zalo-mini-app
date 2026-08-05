// api.js - Standalone AI services calling the FastAPI Backend

const BACKEND_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : ''; // Rỗng để sử dụng Proxy /api/* của Netlify ở Production

export const apiService = {
    /**
     * Sends message to the AI RAG Chatbot API
     */
    async sendMessage(userHistory, newMessage, language = 'auto', activeFeedbackId = null) {
        // Map history to backend format
        const formattedHistory = userHistory.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text
        }));

        const payload = {
            question: newMessage,
            channel: 'web_iframe',
            language: language,
            conversation_history: formattedHistory
        };
        if (activeFeedbackId) {
            payload.active_feedback_id = activeFeedbackId;
        }

        const response = await fetch(`${BACKEND_BASE_URL}/api/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("API Connection Failed");
        const data = await response.json();
        return data;
    },

    /**
     * Uploads an image for a feedback report
     */
    async uploadFeedbackImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Note: Using the admin upload endpoint, but it doesn't enforce auth.
        const response = await fetch(`${BACKEND_BASE_URL}/api/admin/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error("Image Upload Failed");
        return await response.json();
    },

    /**
     * Submits feedback to the backend
     */
    async submitFeedback(feedbackData) {
        const response = await fetch(`${BACKEND_BASE_URL}/api/feedback/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        
        if (!response.ok) throw new Error("Feedback Submission Failed");
        return await response.json();
    },

    /**
     * Appends/updates info to an existing feedback report ticket
     */
    async appendFeedback(feedbackId, appendData) {
        const response = await fetch(`${BACKEND_BASE_URL}/api/feedback/${feedbackId}/append`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appendData)
        });
        
        if (!response.ok) throw new Error("Feedback Append Failed");
        return await response.json();
    }
};
