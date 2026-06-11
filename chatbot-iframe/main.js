// main.js - Chatbot UI Controller (Production V1.0)
import { apiService } from './api.js';

let messages = [];
let isLoading = false;


// DOM Elements
const msgContainer = document.getElementById('messagesContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const suggestionsArea = document.getElementById('suggestions');

function startChatSession() {
    if (msgContainer.classList.contains('justify-center')) {
        msgContainer.classList.remove('justify-center');
        msgContainer.classList.add('justify-start');
    }
}

userInput.onfocus = startChatSession;
userInput.onclick = startChatSession;



// ---------------- UI Logic ----------------

// Inner wrapper where messages are appended
const getMsgWrapper = () => msgContainer.querySelector('.space-y-5') || msgContainer;

function addMessage(role, text, isLoadingMsg = false) {
    const isUser = role === 'user';
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex items-start gap-3 message-animate ${isUser ? 'flex-row-reverse' : ''}`;

    const sanitizedText = DOMPurify.sanitize(marked.parse(text || ''));

    const avatarStyle = isUser
        ? 'background:#e2e8f0; color:#64748b;'
        : 'background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0;';
    const bubbleStyle = isUser
        ? 'background:#16a34a; color:#ffffff; border-radius:1rem 0.25rem 1rem 1rem; border:none;'
        : 'background:#ffffff; color:#1e293b; border-radius:0.25rem 1rem 1rem 1rem; border:1px solid #e2e8f0;';
    const timeStyle = isUser ? 'color:rgba(255,255,255,0.6)' : 'color:#94a3b8';

    const userIcon = `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`;
    const botIcon = `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>`;

    const loadingDots = `<span style="display:inline-flex;gap:4px;padding:4px 0">
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
        <span class="loading-dot"></span>
    </span>`;

    msgDiv.innerHTML = `
        <div style="width:36px;height:36px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;${avatarStyle}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${isUser ? userIcon : botIcon}</svg>
        </div>
        <div style="max-width:82%;padding:12px 16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);${bubbleStyle}">
            <div class="prose prose-sm" style="${isUser ? 'color:#fff' : 'color:#1e293b'}">
                ${isLoadingMsg ? loadingDots : sanitizedText}
            </div>
            <div style="margin-top:4px;font-size:10px;text-align:right;${timeStyle}">
                ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    `;

    getMsgWrapper().appendChild(msgDiv);
    msgContainer.scrollTo({ top: msgContainer.scrollHeight, behavior: 'smooth' });
    return msgDiv;
}

function updateSuggestions() {
    const list = ["Cáp treo vận hành lúc mấy giờ?", "Combo buffet & vé cáp treo?", "Săn mây vào giờ nào thì đẹp?", "Cần chuẩn bị gì khi đi bộ lên núi?"];
    suggestionsArea.innerHTML = list.map(q =>
        `<button class="suggestion-btn whitespace-nowrap flex-shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-brand-50 hover:text-brand-700 active:scale-95 border border-slate-100">${q}</button>`
    ).join('');
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.onclick = () => { userInput.value = btn.innerText.trim(); handleSend(); };
    });
}

// ---------------- Actions ----------------

async function handleSend() {
    startChatSession();
    const text = userInput.value.trim();
    if (!text || isLoading) return;
    
    // Hide suggestions after the first message is sent
    if (suggestionsArea) {
        suggestionsArea.style.opacity = '0';
        setTimeout(() => suggestionsArea.classList.add('hidden'), 300);
    }

    userInput.value = '';
    isLoading = true;
    addMessage('user', text);
    
    const loadingEl = addMessage('model', '', true);
    
    try {
        const reply = await apiService.sendMessage(messages, text);
        loadingEl.remove();
        addMessage('model', reply);
        
        // History management
        messages.push({ role: 'user', parts: [{ text }] });
        messages.push({ role: 'model', parts: [{ text: reply }] });
        // Keep history short for performance
        if (messages.length > 20) messages = messages.slice(-10);
    } catch (err) {
        console.error(err);
        loadingEl.remove();
        addMessage('model', "Rất tiếc, đã có lỗi kết nối. Anh/Chị vui lòng thử lại sau giây lát ạ!");
    } finally {
        isLoading = false;
    }
}

// ---------------- Reset Button ----------------

const resetChatBtn = document.getElementById('resetChatBtn');

resetChatBtn.onclick = () => {
    if (confirm("Làm mới cuộc hội thoại này?")) {
        messages = [];
        msgContainer.classList.add('justify-center');
        msgContainer.classList.remove('justify-start');
        msgContainer.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-9 h-9 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 border border-brand-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div class="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
                    <p class="text-[15px] leading-relaxed">Chào mừng bạn trở lại! ⛰️<br>Tôi đã sẵn sàng cho một cuộc trò chuyện mới. Bạn cần hỗ trợ gì ạ?</p>
                </div>
            </div>
        `;
        suggestionsArea.classList.remove('hidden');
        setTimeout(() => suggestionsArea.style.opacity = '1', 50);
        updateSuggestions();
    }
};

// Lắng nghe các nút chức năng
chatForm.onsubmit = (e) => { e.preventDefault(); handleSend(); };

// Mobile Keyboard Fix (Visual Viewport)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        document.body.style.height = `${window.visualViewport.height}px`;
        msgContainer.scrollTop = msgContainer.scrollHeight;
    });
}

function init() {
    updateSuggestions();
    msgContainer.scrollTop = 0;
}

init();
