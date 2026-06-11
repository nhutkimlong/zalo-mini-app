// main.js - Chatbot UI Controller (Production V1.0)
import { apiService } from './api.js';

let messages = [];
let isLoading = false;
let isPlannerLoading = false;

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

// Tab Control
const tabChat = document.getElementById('tabChat');
const tabPlanner = document.getElementById('tabPlanner');
const chatView = document.getElementById('chatView');
const plannerView = document.getElementById('plannerView');

// Planner Elements
const plannerRequest = document.getElementById('plannerRequest');
const generatePlannerBtn = document.getElementById('generatePlannerBtn');
const backPlannerBtn = document.getElementById('backPlannerBtn');
const plannerFormContent = document.getElementById('plannerFormContent');
const plannerResultContent = document.getElementById('plannerResultContent');

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

async function handleItinerary() {
    const req = plannerRequest.value.trim();
    if (!req || isPlannerLoading) return;
    
    isPlannerLoading = true;
    generatePlannerBtn.disabled = true;
    generatePlannerBtn.innerHTML = `<span class="loading-dot !bg-white"></span><span class="loading-dot !bg-white"></span><span class="loading-dot !bg-white"></span>`;

    try {
        const itin = await apiService.generateItinerary(req);
        renderItinerary(itin);
        plannerFormContent.classList.add('hidden');
        plannerResultContent.classList.remove('hidden');
        generatePlannerBtn.classList.add('hidden');
        backPlannerBtn.classList.remove('hidden');
    } catch (err) {
        console.error("handleItinerary error:", err);
        alert("⚠️ " + (err.message || "Lỗi khi lập kế hoạch. Vui lòng mô tả lại chi tiết hơn."));
    } finally {
        isPlannerLoading = false;
        generatePlannerBtn.disabled = false;
        generatePlannerBtn.innerHTML = `<span>Phân tích lịch trình</span>`;
    }
}

function renderItinerary(data) {
    const zones = { 'chan_nui': 'Chân núi', 'chua_ba': 'Chùa Bà', 'dinh_nui': 'Đỉnh núi' };
    const stepsHtml = data.steps.map(step => `
        <div class="itinerary-step">
            <div class="itinerary-marker"></div>
            <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-1">
                    <h5 class="font-bold text-slate-900">${step.poi_name}</h5>
                    <span class="text-[10px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        ${zones[step.zone] || 'Địa điểm'}
                    </span>
                </div>
                <div class="text-xs font-bold text-brand-600 mb-2">Thời gian: ~${step.estimated_duration_minutes} phút</div>
                <p class="text-sm text-slate-600 leading-relaxed">${step.description}</p>
            </div>
        </div>`).join('');
        
    plannerResultContent.innerHTML = `
        <div class="fade-in">
            <div class="p-3 bg-brand-50 rounded-2xl mb-5 flex items-center gap-3 border border-brand-100">
                <div style="width:40px;height:40px;flex-shrink:0;background:#16a34a;border-radius:12px;display:flex;align-items:center;justify-content:center;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                    <p style="font-size:10px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;">Lịch trình gợi ý</p>
                    <p style="font-size:14px;font-weight:700;color:#1e293b;">${data.title}</p>
                    <p style="font-size:12px;color:#64748b;">Tổng thời gian ước tính: ~${data.total_duration_minutes} phút</p>
                </div>
            </div>

            <div class="itinerary-list pl-4">${stepsHtml}</div>

            <!-- Disclaimer & Hotline -->
            <div style="margin-top:24px;background:#fffbeb;border:1px solid #fde68a;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;gap:10px;align-items:flex-start;">
                    <span style="font-size:18px;">⚠️</span>
                    <div>
                        <p style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:4px;">Lưu ý quan trọng</p>
                        <p style="font-size:12px;color:#78350f;line-height:1.6;">Lịch trình trên do <strong>AI tham khảo</strong> và có thể thay đổi tùy theo lịch vận hành thực tế (cáp treo, máng trượt, nhà hàng...). Vui lòng xác nhận giờ hoạt động trước khi đến.</p>
                    </div>
                </div>
                <div style="border-top:1px solid #fde68a;padding-top:12px;">
                    <p style="font-size:12px;color:#78350f;margin-bottom:10px;">📞 Liên hệ tư vấn trực tiếp & đặt dịch vụ:</p>
                    <a href="tel:02763823378" style="display:flex;align-items:center;justify-content:center;gap:8px;background:#16a34a;color:white;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(22,163,74,0.3);">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.16 6.16l.92-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        Gọi 0276 3823 378
                    </a>
                </div>
            </div>
        </div>
    `;
}

// ---------------- Tab Switches & Reset ----------------

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

tabChat.onclick = () => {
    chatView.classList.remove('hidden'); plannerView.classList.add('hidden');
    tabChat.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-brand-700 shadow-sm";
    tabPlanner.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-500 hover:text-slate-700";
};

tabPlanner.onclick = () => {
    plannerView.classList.remove('hidden'); chatView.classList.add('hidden');
    tabPlanner.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition-all bg-white text-brand-700 shadow-sm";
    tabChat.className = "px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-slate-500 hover:text-slate-700";
};

// Lắng nghe các nút chức năng
chatForm.onsubmit = (e) => { e.preventDefault(); handleSend(); };
generatePlannerBtn.onclick = handleItinerary;
backPlannerBtn.onclick = () => {
    plannerFormContent.classList.remove('hidden'); plannerResultContent.classList.add('hidden');
    generatePlannerBtn.classList.remove('hidden'); backPlannerBtn.classList.add('hidden');
};

// Mobile Keyboard Fix (Visual Viewport)
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        document.body.style.height = `${window.visualViewport.height}px`;
        msgContainer.scrollTop = msgContainer.scrollHeight;
    });
}

function init() {
    updateSuggestions();
    
    const plannerSugs = [
        "Lịch trình 1 ngày cho gia đình có trẻ em",
        "Hành trình hành hương lễ Phật trong 4 tiếng",
        "Lịch trình có ăn buffet trưa trên đỉnh núi",
        "Khám phá cả 3 khu vực trong một ngày"
    ];
    document.getElementById('plannerSuggestions').innerHTML = `
        <label class="text-sm font-bold text-slate-700 ml-1">Gợi ý yêu cầu</label>
        <div class="flex flex-wrap gap-2">
            ${plannerSugs.map(s => `<button class="plan-sug-btn text-xs bg-slate-100 hover:bg-brand-50 hover:text-brand-700 px-3 py-2 rounded-xl transition-all border border-slate-200">${s}</button>`).join('')}
        </div>
    `;
    
    document.querySelectorAll('.plan-sug-btn').forEach(btn => {
        btn.onclick = () => { plannerRequest.value = btn.innerText; };
    });

    msgContainer.scrollTop = 0;
}

init();
