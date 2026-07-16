// main.js - Chatbot UI Controller (Production V1.0)
import { apiService } from './api.js';

let messages = [];
let isLoading = false;
let currentLang = 'vi';

const FLAGS_SVG = {
    vi: `<svg viewBox="0 0 30 20" class="w-full h-full rounded-sm overflow-hidden"><rect width="30" height="20" fill="#da251d"/><polygon points="15,4 16.2,8.8 21.2,8.8 17.2,11.8 18.7,16.6 15,13.6 11.3,16.6 12.8,11.8 8.8,8.8 13.8,8.8" fill="#ffff00"/></svg>`,
    auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 text-slate-500"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`,
    en: `<svg viewBox="0 0 60 30" class="w-full h-full rounded-sm overflow-hidden" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="30" fill="#012169"/><path d="M0 0 L60 30 M0 30 L60 0" stroke="#fff" stroke-width="6"/><path d="M0 0 L60 30 M0 30 L60 0" stroke="#C8102E" stroke-width="2"/><path d="M30 0 V30 M0 15 H60" stroke="#fff" stroke-width="10"/><path d="M30 0 V30 M0 15 H60" stroke="#C8102E" stroke-width="6"/></svg>`,
    km: `<svg viewBox="0 0 25 16" class="w-full h-full rounded-sm overflow-hidden"><rect width="25" height="16" fill="#032ea1"/><rect y="4" width="25" height="8" fill="#e21c21"/><path d="M12.5 6.5 L14 9 H11 Z M10.5 7.5 L11.5 9.5 H9.5 Z M14.5 7.5 L15.5 9.5 H13.5 Z M9 10.5 H16 V11.5 H9 Z" fill="#fff"/></svg>`
};

const TRANSLATIONS = {
    vi: {
        online: "Đang trực tuyến",
        placeholder: "Hỏi về Núi Bà Đen...",
        resetConfirm: "Làm mới cuộc hội thoại này?",
        welcome: "Chào mừng bạn đến với <strong style=\"color:#15803d;\">Khu du lịch quốc gia Núi Bà Đen</strong>! ⛰️<br>Tôi là trợ lý AI thông minh, rất vui được hỗ trợ bạn lên kế hoạch và tìm hiểu về Núi Bà Đen. Bạn cần hỏi gì ạ?",
        welcomeReset: "Chào mừng bạn trở lại! ⛰️<br>Tôi đã sẵn sàng cho một cuộc trò chuyện mới. Bạn cần hỗ trợ gì ạ?",
        suggestions: [
            "Cáp treo vận hành lúc mấy giờ?",
            "Combo buffet & vé cáp treo?",
            "Săn mây vào giờ nào thì đẹp?",
            "Cần chuẩn bị gì khi đi bộ lên núi?"
        ],
        errorMsg: "Rất tiếc, đã có lỗi kết nối. Anh/Chị vui lòng thử lại sau giây lát ạ!"
    },
    en: {
        online: "Online",
        placeholder: "Ask about Ba Den Mountain...",
        resetConfirm: "Reset this conversation?",
        welcome: "Welcome to <strong style=\"color:#15803d;\">Ba Den Mountain National Tourist Area</strong>! ⛰️<br>I am your smart AI assistant. I'm happy to help you plan your trip and learn about Ba Den Mountain. How can I help you?",
        welcomeReset: "Welcome back! ⛰️<br>I am ready for a new conversation. What do you need help with?",
        suggestions: [
            "What time does the cable car operate?",
            "Combo buffet & cable car tickets?",
            "What is the best time to hunt for clouds?",
            "What to prepare when hiking the mountain?"
        ],
        errorMsg: "Sorry, there was a connection error. Please try again in a moment!"
    },
    km: {
        online: "អនឡាញ",
        placeholder: "សួរអំពីភ្នំបាដិន...",
        resetConfirm: "ធ្វើឱ្យការសន្ទនានេះស្រស់ឡើងវិញ?",
        welcome: "សូមស្វាគមន៍មកកាន់ <strong style=\"color:#15803d;\">រមណីយដ្ឋានទេសចរណ៍ជាតិភ្នំបាដិន</strong>! ⛰️<br> ខ្ញុំជាជំនួយការ AI ឆ្លាតវៃ រីករាយនឹងជួយអ្នករៀបចំផែនការ និងស្វែងយល់អំពីភ្នំបាដិន។ តើអ្នកចង់សួរអ្វីដែរ?",
        welcomeReset: "សូមស្វាគមន៍ត្រឡប់មកវិញ! ⛰️<br>ខ្ញុំរួចរាល់សម្រាប់ការសន្ទនាថ្មី។ តើអ្នកត្រូវការជំនួយអ្វីខ្លះ?",
        suggestions: [
            "តើឡានកាបបើកដំណើរការម៉ោងប៉ុន្មាន?",
            "កញ្ចប់អាហារប៊ូហ្វេ និងសំបុត្រឡានកាប?",
            "តើម៉ោងណាដែលស្អាតបំផុតសម្រាប់មើលពពក?",
            "តើត្រូវរៀបចំអ្វីខ្លះពេលដើរឡើងភ្នំ?"
        ],
        errorMsg: "សុំទោស មានកំហុសក្នុងការតភ្ជាប់។ សូមព្យាយាមម្តងទៀតនៅពេលបន្តិចទៀត!"
    }
};


// DOM Elements
const msgContainer = document.getElementById('messagesContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const suggestionsArea = document.getElementById('suggestions');
const langDropdownTrigger = document.getElementById('langDropdownTrigger');
const langDropdownMenu = document.getElementById('langDropdownMenu');
const dropdownOptions = langDropdownMenu ? langDropdownMenu.querySelectorAll('button[data-value]') : [];

function startChatSession() {
    // Keep it justify-start from start
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
    const lang = currentLang === 'auto' ? 'vi' : currentLang;
    const list = TRANSLATIONS[lang]?.suggestions || TRANSLATIONS.vi.suggestions;
    suggestionsArea.innerHTML = list.map(q =>
        `<button class="suggestion-btn whitespace-nowrap flex-shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-brand-50 hover:text-brand-700 active:scale-95 border border-slate-100">${q}</button>`
    ).join('');
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.onclick = () => { userInput.value = btn.innerText.trim(); handleSend(); };
    });
}

// ---------------- Actions ----------------

function removeAccents(str) {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[đĐ]/g, m => m === 'đ' ? 'd' : 'D');
}

function validateMessage(text) {
    if (!text || !text.trim()) return { isValid: true };

    // 1. Emoji count validation (limit to maximum 3 emojis)
    const emojiCount = (text.match(/\p{Extended_Pictographic}/gu) || []).length;
    if (emojiCount > 3) {
        return {
            isValid: false,
            reason: "Tin nhắn chứa quá nhiều biểu tượng cảm xúc (emoji).",
            reasonEn: "Message contains too many emojis.",
            reasonKm: "សារមានរូបសញ្ញាអារម្មណ៍ច្រើនពេក។"
        };
    }

    // 2. Repetitive characters validation
    if (/([^\w\s])\1{3,}/g.test(text) || /(.)\1{5,}/gi.test(text)) {
        return {
            isValid: false,
            reason: "Tin nhắn chứa ký tự lặp lại quá nhiều lần.",
            reasonEn: "Message contains too many repetitive characters.",
            reasonKm: "សារមានតួអក្សរដដែលៗច្រើនដងពេក។"
        };
    }

    // 3. Vulgar language validation
    const textLower = text.toLowerCase().trim();
    const textNormalized = removeAccents(textLower);

    const accentedVulgar = ["cặc", "lồn", "đéo", "buồi", "địt", "đụ", "ỉa", "đái", "óc chó", "chó đẻ", "khốn nạn", "thằng chó", "con đĩ", "đĩ", "mẹ kiếp"];
    const unaccentedVulgar = ["dit", "du", "dm", "dkm", "clm", "vcl", "cmn", "cmnr", "dcm", "vl", "vkl", "đm", "dkmm", "clmn", "vcln"];
    const phrasalVulgar = [
        "con cac", "con cack", "con cak", "con c@c", "con c*c",
        "cai lon", "cai l0n", "cai l*n",
        "an cac", "an cặc", "an buoi", "an buồi",
        "phat deo", "phat đéo", "thang cho", "thằng chó",
        "dit me", "địt mẹ", "dit con me", "địt con mẹ",
        "du me", "đụ mẹ", "du ma", "đụ má", "dcm",
        "oc cho", "óc chó", "cho de", "chó đẻ", "khon nan", "khốn nạn"
    ];

    for (const phrase of phrasalVulgar) {
        if (textLower.includes(phrase) || textNormalized.includes(phrase)) {
            return {
                isValid: false,
                reason: "Tin nhắn chứa từ ngữ không phù hợp.",
                reasonEn: "Message contains inappropriate language.",
                reasonKm: "សារមានពាក្យសម្តីមិនសមរម្យ។"
            };
        }
    }

    const wordsOriginal = textLower.split(/[^a-z0-9ăâđêôơưàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]/i);
    const wordsNormalized = textNormalized.split(/[^a-z0-9]/i);

    for (const word of accentedVulgar) {
        if (wordsOriginal.includes(word)) {
            return {
                isValid: false,
                reason: "Tin nhắn chứa từ ngữ không phù hợp.",
                reasonEn: "Message contains inappropriate language.",
                reasonKm: "សារមានពាក្យសម្តីមិនសមរម្យ។"
            };
        }
    }

    for (const word of unaccentedVulgar) {
        if (wordsNormalized.includes(word)) {
            return {
                isValid: false,
                reason: "Tin nhắn chứa từ ngữ không phù hợp.",
                reasonEn: "Message contains inappropriate language.",
                reasonKm: "សារមានពាក្យសម្តីមិនសមរម្យ។"
            };
        }
    }

    return { isValid: true };
}

async function handleSend() {
    startChatSession();
    const text = userInput.value.trim();
    if (!text || isLoading) return;
    
    // Local validation
    const validation = validateMessage(text);
    if (!validation.isValid) {
        // Render user message first to show their context
        addMessage('user', text);
        const errorMsg = currentLang === 'en' ? `Message rejected: ${validation.reasonEn}` :
                         currentLang === 'km' ? `សារមិនត្រឹមត្រូវ៖ ${validation.reasonKm}` :
                         `Chào bạn, câu hỏi chưa phù hợp: ${validation.reason} Bạn vui lòng điều chỉnh lại câu hỏi nhé!`;
        addMessage('model', errorMsg);
        userInput.value = '';
        return;
    }

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
        const replyData = await apiService.sendMessage(messages, text, currentLang);
        loadingEl.remove();
        const replyText = replyData.answer || replyData; // Fallback in case of string
        addMessage('model', replyText);
        
        // History management
        messages.push({ role: 'user', parts: [{ text }] });
        messages.push({ role: 'model', parts: [{ text: replyText }] });
        // Keep history short for performance
        if (messages.length > 20) messages = messages.slice(-10);

        if (replyData.type === 'feedback_request') {
            renderFeedbackForm();
        }
    } catch (err) {
        console.error(err);
        loadingEl.remove();
        const activeLang = currentLang === 'auto' ? 'vi' : currentLang;
        const errMsg = TRANSLATIONS[activeLang]?.errorMsg || TRANSLATIONS.vi.errorMsg;
        addMessage('model', errMsg);
    } finally {
        isLoading = false;
    }
}

function renderFeedbackForm() {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex items-start gap-3 message-animate`;
    
    msgDiv.innerHTML = `
        <div style="width:36px;height:36px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div style="max-width:82%;width:100%;padding:16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.25rem 1rem 1rem 1rem;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <h3 style="font-weight:600;font-size:15px;margin-bottom:12px;color:#0f172a;">Gửi Phản Ánh / Góp Ý</h3>
            <form id="feedbackFormInner" class="flex flex-col gap-3">
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Loại phản ánh *</label>
                    <select id="fbType" required class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-500 bg-slate-50">
                        <option value="khac">Khác</option>
                        <option value="ve_sinh">Vệ sinh môi trường</option>
                        <option value="gia_ca">Giá cả dịch vụ</option>
                        <option value="an_ninh">An ninh trật tự</option>
                        <option value="thai_do">Thái độ nhân viên</option>
                        <option value="ha_tang">Hạ tầng/Cơ sở vật chất</option>
                        <option value="cheo_keo">Tình trạng chèo kéo</option>
                        <option value="gop_y">Góp ý cải thiện</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Nội dung chi tiết *</label>
                    <textarea id="fbContent" required rows="3" placeholder="Xin vui lòng mô tả chi tiết..." class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-500 bg-slate-50 resize-none"></textarea>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Hình ảnh đính kèm (nếu có)</label>
                    <input type="file" id="fbImage" accept="image/*" class="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 rounded-lg">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại (tùy chọn)</label>
                    <input type="text" id="fbPhone" placeholder="Để BQL liên hệ lại..." class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand-500 bg-slate-50">
                </div>
                <button type="submit" id="fbSubmitBtn" class="mt-2 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                    Gửi Phản Ánh
                </button>
            </form>
        </div>
    `;
    getMsgWrapper().appendChild(msgDiv);
    msgContainer.scrollTo({ top: msgContainer.scrollHeight, behavior: 'smooth' });

    const form = msgDiv.querySelector('#feedbackFormInner');
    const submitBtn = msgDiv.querySelector('#fbSubmitBtn');

    form.onsubmit = async (e) => {
        e.preventDefault();
        const type = form.querySelector('#fbType').value;
        const content = form.querySelector('#fbContent').value.trim();
        const phone = form.querySelector('#fbPhone').value.trim();
        const fileInput = form.querySelector('#fbImage');
        
        if (!content) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Đang gửi...";
        submitBtn.classList.add('opacity-70');

        try {
            let imageUrl = null;
            if (fileInput.files.length > 0) {
                const uploadRes = await apiService.uploadFeedbackImage(fileInput.files[0]);
                imageUrl = uploadRes.url;
            }

            await apiService.submitFeedback({
                report_type: type,
                content: content,
                phone: phone,
                image_url: imageUrl,
                reporter_name: "Khách qua Chatbot"
            });
            
            form.innerHTML = `
                <div class="flex flex-col items-center justify-center py-4 text-center">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <p class="text-sm font-medium text-slate-700">Cảm ơn bạn! BQL đã ghi nhận thông tin phản ánh.</p>
                </div>
            `;
            // Add a follow up AI message to make it smooth
            setTimeout(() => {
                addMessage('model', "Mình đã chuyển thông tin phản ánh của bạn đến Ban Quản Lý (BQL). Bạn có cần mình hỗ trợ thêm thông tin gì khác không ạ?");
            }, 1000);
        } catch (err) {
            console.error(err);
            alert("Đã xảy ra lỗi khi gửi phản ánh. Vui lòng thử lại.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Gửi Phản Ánh";
            submitBtn.classList.remove('opacity-70');
        }
    };
}

// ---------------- UI Translation ----------------

function updateUILanguage(lang) {
    currentLang = lang;
    const activeLang = lang;
    const trans = TRANSLATIONS[activeLang];
    if (!trans) return;

    // 1. Update online status text
    const onlineText = document.getElementById('onlineStatusText');
    if (onlineText) {
        onlineText.textContent = trans.online;
    }

    // 2. Update userInput placeholder
    if (userInput) {
        userInput.placeholder = trans.placeholder;
    }

    // 3. Update welcome message if chat has not started (messages is empty)
    const welcomeText = document.getElementById('welcomeText');
    if (welcomeText && messages.length === 0) {
        welcomeText.innerHTML = `<p style="font-size:15px;line-height:1.6;color:#1e293b;">${trans.welcome}</p>`;
    }

    // 4. Update suggestions list
    updateSuggestions();

    // 5. Update dropdown trigger display (SVG Flag and selection text)
    const selectedFlag = document.getElementById('langDropdownSelectedFlag');
    const selectedText = document.getElementById('langDropdownSelectedText');
    if (selectedFlag) {
        selectedFlag.innerHTML = FLAGS_SVG[lang] || '';
    }
    if (selectedText) {
        let textToShow = "Tiếng Việt";
        if (lang === 'vi') textToShow = "Tiếng Việt";
        else if (lang === 'en') textToShow = "English";
        else if (lang === 'km') textToShow = "Khmer";
        selectedText.textContent = textToShow;
    }
}

// Dropdown Toggle & Options Select
if (langDropdownTrigger && langDropdownMenu) {
    langDropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!langDropdownMenu.classList.contains('hidden') && !e.target.closest('#langDropdown')) {
            langDropdownMenu.classList.add('hidden');
        }
    });

    dropdownOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-value');
            updateUILanguage(val);
            langDropdownMenu.classList.add('hidden');
        });
    });
}

// ---------------- Reset Button ----------------

const resetChatBtn = document.getElementById('resetChatBtn');

resetChatBtn.onclick = () => {
    const lang = currentLang === 'auto' ? 'vi' : currentLang;
    const trans = TRANSLATIONS[lang] || TRANSLATIONS.vi;
    if (confirm(trans.resetConfirm)) {
        messages = [];
        msgContainer.innerHTML = `
            <div class="px-4 pt-4 pb-2 space-y-5 max-w-2xl mx-auto w-full">
                <!-- Welcome Message -->
                <div class="flex items-start gap-3">
                    <div style="width:36px;height:36px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div id="welcomeText" style="max-width:82%;padding:12px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:0.25rem 1rem 1rem 1rem;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                        <p style="font-size:15px;line-height:1.6;color:#1e293b;">${trans.welcomeReset}</p>
                    </div>
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
    updateUILanguage(currentLang);
    msgContainer.scrollTop = 0;
}

init();
