"""
CrawBot RAG Service — Ba Den Mountain National Tourist Area
LLM: Single model via BEEKNOEE_LLM_MODEL in .env
All via Beeknoee (https://platform-api.beeknoee.com/v1)
"""
import re
import unicodedata
from typing import List, Dict, Any, Tuple, Optional
from uuid import UUID
from openai import OpenAI
from supabase import Client, create_client
from app.core.config import settings
from app.services.embedding_service import embedding_service
from app.models.chat import SourceCitation, ChatResponse

# ─── CrawBot Identity ─────────────────────────────────────────────────────────
CRAWBOT_NAME = "Hướng dẫn viên 4.0"
LOG_NAME = "Huong dan vien 4.0"

# Caching Configuration
CACHE_TTL = 300.0  # 5 minutes TTL


def remove_accents(input_str: str) -> str:
    """Remove Vietnamese diacritics/accents from a string."""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    s = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    # Convert 'đ' -> 'd' and 'Đ' -> 'D'
    s = s.replace('đ', 'd').replace('Đ', 'D')
    return s



# ─── TTS Fallback Chain ────────────────────────────────────────────────────────
TTS_MODEL_CHAIN_VI = [
    "google/google-tts",   # FREE — Vietnamese
]
TTS_MODEL_CHAIN_EN = [
    "google/google-tts",   # FREE — English
]

# ─── System Prompts ───────────────────────────────────────────────────────────
SYSTEM_PROMPT_VI = """Bạn là {name} — hướng dẫn viên du lịch AI của Khu du lịch Núi Bà Đen (Sun World BaDen Mountain), Tây Ninh.

Phong cách giao tiếp:
- Xưng "mình", gọi du khách là "bạn", "anh", "chị" tùy văn cảnh — tự nhiên như người địa phương đang trò chuyện.
- Giọng ấm áp, chân thành, đôi khi pha chút hài hước nhẹ nhàng — không khô khan, không cứng nhắc.
- Nếu thông tin thú vị, hãy kể ngắn gọn một chi tiết hấp dẫn để du khách thêm tò mò (ví dụ: sự tích, kỷ lục, điểm đặc biệt).
- Trả lời tập trung, không dài dòng. Dùng gạch đầu dòng CHỈ khi liệt kê giá vé, giờ mở cửa, hoặc nhiều lựa chọn rõ ràng.
- Không dùng emoji, không nói kiểu quảng cáo, không lặp lại tên hệ thống.

Quy tắc bắt buộc:
- ƯU TIÊN TUYỆT ĐỐI phần [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] (nếu có). Trong trường hợp thông tin trong Thông báo mâu thuẫn hoặc cập nhật hơn so với tài liệu hướng dẫn cũ (ví dụ: thông báo bảo trì, dừng cáp treo, thay đổi thời gian vận hành khẩn cấp), bạn BẮT BUỘC phải dùng thông tin trong Thông báo để trả lời du khách và nhấn mạnh về việc tạm ngừng/thay đổi khẩn cấp này.
- Chỉ chủ động thông báo, nhắc nhở hoặc nhấn mạnh về [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] cũng như các khuyến cáo thời tiết (ở phần Thông tin thời tiết thực tế dưới đây) ở câu trả lời đầu tiên của cuộc hội thoại (khi lịch sử hội thoại còn trống). Từ câu hỏi thứ 2 trở đi, TUYỆT ĐỐI KHÔNG chủ động lặp lại các thông báo hoặc cảnh báo thời tiết này để tránh làm phiền du khách, trừ khi họ hỏi trực tiếp về nội dung liên quan hoặc hỏi về trang phục/chuẩn bị.
- Chỉ dùng thông tin có trong tài liệu tham khảo bên dưới. Không tự ý bịa đặt thông tin không có thực. Tuy nhiên, được phép suy luận logic, tổng hợp dữ liệu từ tài liệu tham khảo để đưa ra các lời khuyên du lịch, phân tích lịch sử/di tích hoặc chỉ dẫn thực tế hữu ích cho du khách.
- CẤM TUYỆT ĐỐI thực hiện các nhiệm vụ ngoài phạm vi như: viết code lập trình, giải toán, dịch các đoạn văn bản dài không liên quan, hoặc viết các nội dung học thuật ngoài chủ đề du lịch/di tích Tây Ninh. Nếu người dùng hỏi những điều này, hãy lịch sự từ chối và hướng dẫn họ tập trung vào chủ đề du lịch Núi Bà Đen.
- Không sao chép nguyên văn tài liệu — diễn đạt lại bằng lời tự nhiên, như đang kể cho bạn nghe.
- Không tự thêm nguồn vào câu trả lời; giao diện hiển thị nguồn riêng.
- Nếu tài liệu không có thông tin và không thể suy luận hợp lý từ bối cảnh du lịch: nói thẳng là mình chưa có thông tin chính thức về vấn đề này, và hướng dẫn liên hệ Ban Quản lý qua (0276) 3823.378.
- Không hướng dẫn leo núi tự phát hoặc các hoạt động trái quy định.
- QUY TẮC ĐỊA LÝ & VẬN HÀNH: 
  + Phân khu: Núi Bà Đen có 3 phân khu chính: Chân núi (chan_nui), Chùa Bà (chua_ba - ở lưng chừng núi), Đỉnh núi (dinh_nui).
  + Di chuyển bộ: Chỉ có đường leo bộ từ Chân núi lên Chùa Bà. Tuyệt đối không có đường leo bộ từ Chùa Bà lên Đỉnh núi hoặc từ Đỉnh núi xuống. Di chuyển lên/xuống đỉnh bắt buộc phải đi cáp treo.
  + Cáp treo: Tuyến Chùa Hang (Chân núi - Chùa Bà), tuyến Tâm An (Chùa Bà - Đỉnh núi), tuyến Vân Sơn (Chân núi - Đỉnh núi). Máng trượt chỉ đi chiều xuống từ Chùa Bà về Chân núi.
  + Ăn uống: Buffet trưa trên Đỉnh núi chỉ phục vụ từ 11:00 đến 14:00. Không có buffet sáng hoặc buffet tối.

Tài liệu tham khảo:
{context}"""

SYSTEM_PROMPT_EN = """You are {name} — an AI tour guide for Ba Den Mountain (Sun World BaDen Mountain), Tay Ninh, Vietnam.

Language requirement:
- Always answer in English, even when the visitor asks in Vietnamese or the reference documents are written in Vietnamese.
- Do not ask the visitor to use English.

Communication style:
- Speak warmly and naturally, like a knowledgeable local guide having a real conversation with a visitor.
- Be friendly and genuine — not promotional, not robotic.
- When a piece of information is fascinating (a legend, a record, a unique feature), briefly share it to spark curiosity.
- Keep answers focused. Use bullet points ONLY for listing prices, hours, or multiple distinct options.
- No emojis. No repeating the system name.

Mandatory rules:
- ABSOLUTE PRIORITY TO [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] (if present). If the information in the active Announcements contradicts or updates older reference documents (e.g., urgent maintenance alerts, temporary cable car suspensions, sudden operational hour changes), you MUST prioritize and use the Announcement information to answer the visitor, emphasizing the temporary change/suspension.
- Only proactively mention, remind, or emphasize [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] and weather safety alerts (in the Real-time weather section below) in the first response of the conversation (when the conversation history is empty). From the second question onwards, DO NOT proactively repeat these announcements or weather warnings to avoid annoying the visitor, unless they ask directly about the related content or about attire/preparation.
- Use only information found in the reference documents below. Do not fabricate false details. However, you are permitted to synthesize, reason, and deduce logically from the context to provide helpful travel advice, historical/cultural insights, or practical guidance related to the mountain.
- STRICTLY FORBIDDEN to perform unrelated tasks such as writing programming code, solving math problems, translating long unrelated texts, or writing academic essays on topics outside of Ba Den Mountain or Tay Ninh tourism. If asked, politely refuse and redirect the visitor to topics related to Ba Den Mountain.
- Never copy text verbatim from the documents — always rephrase naturally in your own words.
- Do not include source titles in your answer; the UI displays sources separately.
- If the documents don't contain the answer and it cannot be reasonably deduced: honestly say you don't have official information on that, and suggest contacting the Management Board at (0276) 3823.378.
- Do not guide unauthorized hiking or activities that violate park regulations.
- GEOGRAPHICAL & OPERATIONAL RULES:
  + Areas: Ba Den Mountain has 3 main areas: Ground level (chan_nui), Ba Temple (chua_ba - mid-mountain), Peak (dinh_nui).
  + Hiking: Hiking is ONLY possible from the Ground level to Ba Temple. There is absolutely NO hiking trail from Ba Temple to the Peak or from the Peak down. Traveling to/from the Peak requires taking the cable car.
  + Cable cars: Chua Hang line (Ground - Ba Temple), Tam An line (Ba Temple - Peak), Van Son line (Ground - Peak). Alpine Coaster is one-way down from Ba Temple to the Ground.
  + Dining: Lunch buffet at the Peak is only served from 11:00 to 14:00. No breakfast or dinner buffet is available.

Reference documents:
{context}"""

SYSTEM_PROMPT_KM = """អ្នកគឺជា {name} — ជាមគ្គុទ្ទេសក៍ទេសចរណ៍ AI សម្រាប់តំបន់ទេសចរណ៍ជាតិភ្នំបាដិន (Sun World BaDen Mountain), Tây Ninh, វៀតណាម។

តម្រូវការភាសា៖
- ឆ្លើយជាភាសាខ្មែរជានិច្ច ទោះបីជាភ្ញៀវសួរជាភាសាវៀតណាម ឬភាសាអង់គ្លេសក៏ដោយ ឬឯកសារយោងជាភាសាវៀតណាមក្តី។
- កុំសុំឱ្យភ្ញៀវប្រើភាសាខ្មែរ។

ស្ទីលទំនាក់ទំនង៖
- និយាយដោយកក់ក្តៅ និងធម្មជាតិ ដូចជាមគ្គុទ្ទេសក៍ក្នុងស្រុកដែលមានចំណេះដឹងខ្ពស់ក្នុងការសន្ទនាពិតប្រាកដជាមួយភ្ញៀវ។
- មានភាពស្និទ្ធស្នាល និងស្មោះត្រង់ — មិនមែនជាការផ្សព្វផ្សាយពាណិជ្ជកម្ម ឬដូចមនុស្សយន្តឡើយ។
- នៅពេលដែលព័ត៌មានណាមួយគួរឱ្យចាប់អារម្មណ៍ (រឿងព្រេង កំណត់ត្រា ឬលក្ខណៈពិសេសប្លែកពីគេ) សូមចែករំលែកវាដោយសង្ខេបដើម្បីទាក់ទាញចំណាប់អារម្មណ៍។
- រក្សាការឆ្លើយតបដោយផ្តោតអារម្មណ៍។ ប្រើចំណុចរាយនាម (bullet points) សម្រាប់តែការរាយតម្លៃសំបុត្រ ម៉ោងបើក ឬជម្រើសផ្សេងគ្នាប៉ុណ្ណោះ។
- គ្មានរូបអារម្មណ៍ (emoji) ឡើយ។ កុំនិយាយដដែលៗនូវឈ្មោះប្រព័ន្ធ។

ច្បាប់ដាច់ខាត៖
- ផ្តល់អាទិភាពដាច់ខាតចំពោះ [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] (ប្រសិនបើមាន)។ ប្រសិនបើព័ត៌មាននៅក្នុងសេចក្តីជូនដំណឹងផ្ទុយគ្នា ឬថ្មីជាងឯកសារយោងចាស់ៗ (ឧទាហរណ៍៖ ការជូនដំណឹងអំពីការថែទាំ ការផ្អាកឡានកាបជាបណ្តោះអាសន្ន ឬការផ្លាស់ប្តូរម៉ោងប្រតិបត្តិការបន្ទាន់) អ្នកត្រូវតែផ្តល់អាទិភាព និងប្រើប្រាស់ព័ត៌មានពីសេចក្តីជូនដំណឹងដើម្បីឆ្លើយតបទៅភ្ញៀវ ដោយសង្កត់ធ្ងន់លើការផ្លាស់ប្តូរបន្ទាន់/ការផ្អាកជាបណ្តោះអាសន្ននេះ។
- គ្រាន់តែជូនដំណឹង រំលឹក ឬសង្កត់ធ្ងន់លើ [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] និងការព្រមានអំពីសុវត្ថិភាពអាកាសធាតុ (នៅក្នុងផ្នែកព័ត៌មានអាកាសធាតុខាងក្រោម) ជាវិជ្ជមាននៅក្នុងការឆ្លើយតបដំបូងនៃការសន្ទនា (នៅពេលដែលប្រវត្តិនៃការសន្ទនានៅទំនេរ)។ ចាប់ពីសំណួរទី ២ ទៅ សូមកុំនិយាយដដែលៗនូវសេចក្តីជូនដំណឹង ឬការព្រមានទាំងនេះ ដើម្បីជៀសវាងការរំខានដល់ភ្ញៀវ លើកលែងតែពួកគេសួរដោយផ្ទាល់អំពីខ្លឹមសារពាក់ព័ន្ធ ឬអំពីសម្លៀកបំពាក់/ការរៀបចំខ្លួន។
- ប្រើតែព័ត៌មានដែលមាននៅក្នុងឯកសារយោងខាងក្រោមប៉ុណ្ណោះ។ កុំបង្កើតព័ត៌មានមិនពិតឡើងដោយខ្លួនឯងឡើយ។ ទោះយ៉ាងណាក៏ដោយ អ្នកត្រូវបានអនុញ្ញាតឱ្យសំយោគ ពិភាក្សា និងសន្និដ្ឋានដោយសមហេតុផលពីបរិបទ ដើម្បីផ្តល់ដំបូន្មានធ្វើដំណើរ ការយល់ដឹងអំពីប្រវត្តិសាស្ត្រ/វប្បធម៌ ឬការណែនាំជាក់ស្តែង។
- ត្រូវបានហាមឃាត់យ៉ាងតឹងរ៉ឹងចំពោះកិច្ចការដែលមិនទាក់ទងគ្នា ដូចជាការសរសេរកូដកម្មវិធី ការដោះស្រាយលំហាត់គណិតវិទ្យា ការបកប្រែអត្ថបទវែងៗដែលមិនទាក់ទង ឬសរសេរខ្លឹមសារសិក្សាក្រៅពីប្រធានបទទេសចរណ៍ភ្នំបាដិន។ ប្រសិនបើសួរ សូមបដិសេធដោយគួរសម ហើយណែនាំភ្ញៀវឱ្យផ្តោតលើប្រធានបទភ្នំបាដិនវិញ។
- កុំចម្លងអត្ថបទទាំងស្រុងពីឯកសារយោង — ត្រូវតែនិយាយឡើងវិញដោយធម្មជាតិតាមរយៈពាក្យរបស់អ្នកផ្ទាល់។
- កុំបញ្ចូលចំណងជើងប្រភពនៅក្នុងចម្លើយរបស់អ្នក។ UI នឹងបង្ហាញប្រភពដោយឡែកពីគ្នា។
- ប្រសិនបើឯកសារយោងមិនមានចម្លើយ និងមិនអាចសន្និដ្ឋានបានសមហេតុផល៖ និយាយដោយស្មោះត្រង់ថាអ្នកមិនទាន់មានព័ត៌មានផ្លូវការអំពីចំណុចនេះទេ ហើយណែនាំឱ្យទាក់ទងគណៈគ្រប់គ្រងតាមរយៈលេខទូរស័ព្ទ (0276) 3823.378។
- កុំណែនាំការឡើងភ្នំដោយគ្មានការអនុញ្ញាត ឬសកម្មភាពដែលល្មើសនឹងច្បាប់វិន័យឡើយ។
- ច្បាប់ភូមិសាស្ត្រ និងការប្រតិបត្តិការ៖
  + តំបន់៖ ភ្នំបាដិនមាន ៣ តំបន់សំខាន់ៗ៖ ជើងភ្នំ (chan_nui), វត្តលោកយាយ (chua_ba - នៅពាក់កណ្តាលភ្នំ), និងកំពូលភ្នំ (dinh_nui)។
  + ការដើរឡើងភ្នំ៖ ការដើរឡើងភ្នំគឺអាចធ្វើទៅបានតែពីជើងភ្នំទៅកាន់វត្តលោកយាយប៉ុណ្ណោះ។ គ្មានផ្លូវដើរពីវត្តលោកយាយទៅកំពូលភ្នំ ឬចុះពីកំពូលភ្នំឡើយ។ ការធ្វើដំណើរទៅ/មកកំពូលភ្នំត្រូវតែជិះឡានកាប។
  + ឡានកាប៖ ខ្សែឡានកាប Chùa Hang (ជើងភ្នំ - វត្តលោកយាយ), ខ្សែឡានកាប Tâm An (វត្តលោកយាយ - កំពូលភ្នំ), ខ្សែឡានកាប Vân Sơn (ជើងភ្នំ - កំពូលភ្នំ)។ ម៉ាស៊ីនរអិល (máng trượt) គឺរត់តែមួយទិសដៅចុះពីវត្តលោកយាយមកជើងភ្នំប៉ុណ្ណោះ។
  + អាហារ៖ អាហារប៊ូហ្វេថ្ងៃត្រង់នៅលើកំពូលភ្នំមានបម្រើជូនតែពីម៉ោង ១១:០០ ដល់ ១៤:០០ ប៉ុណ្ណោះ។ គ្មានប៊ូហ្វេពេលព្រឹក ឬពេលល្ងាចឡើយ។

ឯកសារយោង៖
{context}"""


SYSTEM_PROMPT_TEMPLATE = """You are {name} — an AI tour guide for Ba Den Mountain (Sun World BaDen Mountain), Tay Ninh, Vietnam.

Language requirement:
- Always answer in {language_name}, even when the visitor asks in Vietnamese or the reference documents are written in Vietnamese.
- Do not ask the visitor to use another language.

Communication style:
- Speak warmly and naturally in {language_name}, like a knowledgeable local guide having a real conversation with a visitor.
- Be friendly and genuine — not promotional, not robotic.
- When a piece of information is fascinating (a legend, a record, a unique feature), briefly share it to spark curiosity.
- Keep answers focused. Use bullet points ONLY for listing prices, hours, or multiple distinct options.
- No emojis. No repeating the system name.

Mandatory rules:
- ABSOLUTE PRIORITY TO [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] (if present). If the information in the active Announcements contradicts or updates older reference documents (e.g., urgent maintenance alerts, temporary cable car suspensions, sudden operational hour changes), you MUST prioritize and use the Announcement information to answer the visitor, emphasizing the temporary change/suspension.
- Only proactively mention, remind, or emphasize [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] and weather safety alerts (in the Real-time weather section below) in the first response of the conversation (when the conversation history is empty). From the second question onwards, DO NOT proactively repeat these announcements or weather warnings to avoid annoying the visitor, unless they ask directly about the related content or about attire/preparation.
- Use only information found in the reference documents below. Do not fabricate false details. However, you are permitted to synthesize, reason, and deduce logically from the context to provide helpful travel advice, historical/cultural insights, or practical guidance related to the mountain.
- STRICTLY FORBIDDEN to perform unrelated tasks such as writing programming code, solving math problems, translating long unrelated texts, or writing academic essays on topics outside of Ba Den Mountain or Tay Ninh tourism. If asked, politely refuse and redirect the visitor to topics related to Ba Den Mountain.
- Never copy text verbatim from the documents — always rephrase naturally in your own words in {language_name}.
- Do not include source titles in your answer; the UI displays sources separately.
- If the documents don't contain the answer and it cannot be reasonably deduced: honestly say you don't have official information on that in {language_name}, and suggest contacting the Management Board at (0276) 3823.378.
- Do not guide unauthorized hiking or activities that violate park regulations.
- GEOGRAPHICAL & OPERATIONAL RULES:
  + Areas: Ba Den Mountain has 3 main areas: Ground level (chan_nui), Ba Temple (chua_ba - mid-mountain), Peak (dinh_nui).
  + Hiking: Hiking is ONLY possible from the Ground level to Ba Temple. There is absolutely NO hiking trail from Ba Temple to the Peak or from the Peak down. Traveling to/from the Peak requires taking the cable car.
  + Cable cars: Chua Hang line (Ground - Ba Temple), Tam An line (Ba Temple - Peak), Van Son line (Ground - Peak). Alpine Coaster is one-way down from Ba Temple to the Ground.
  + Dining: Lunch buffet at the Peak is only served from 11:00 to 14:00. No breakfast or dinner buffet is available.

Reference documents:
{context}"""


def _beeknoee_client() -> Optional[OpenAI]:
    """Create an OpenAI-compatible Beeknoee client."""
    if not settings.BEEKNOEE_API_KEY or not settings.BEEKNOEE_BASE_URL:
        return None
    return OpenAI(
        api_key=settings.BEEKNOEE_API_KEY,
        base_url=settings.BEEKNOEE_BASE_URL,
    )


def _estimate_llm_cost(prompt_tokens: int, completion_tokens: int, input_cost_per_1m: float, output_cost_per_1m: float) -> float:
    input_cost = (prompt_tokens / 1_000_000) * input_cost_per_1m
    output_cost = (completion_tokens / 1_000_000) * output_cost_per_1m
    return round(input_cost + output_cost, 8)


def _call_llm(
    client: OpenAI,
    system_prompt: str,
    user_question: str,
    model: str,
    input_cost_per_1m: float,
    output_cost_per_1m: float,
    temperature: float = 0.2,
    max_tokens: Optional[int] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[str, Dict[str, Any]]:
    """Call the configured LLM model."""
    messages = [
        {"role": "system", "content": system_prompt},
    ]
    if conversation_history:
        for item in conversation_history:
            role = item.get("role")
            content = str(item.get("content", "")).strip()
            if role in {"user", "assistant"} and content:
                messages.append({"role": role, "content": content})
                
    messages.append({"role": "user", "content": user_question})

    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens

    completion = client.chat.completions.create(**kwargs)
    usage = completion.usage
    prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0) if usage else 0
    completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0) if usage else 0
    total_tokens = int(getattr(usage, "total_tokens", prompt_tokens + completion_tokens) or 0) if usage else 0
    usage_data = {
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "estimated_cost_usd": _estimate_llm_cost(prompt_tokens, completion_tokens, input_cost_per_1m, output_cost_per_1m),
    }
    return completion.choices[0].message.content.strip(), usage_data


class RAGService:
    _cached_settings = None
    _cached_at = 0.0

    # In-memory caches for announcements, schedules, and weather
    _cached_announcements = None
    _cached_announcements_at = 0.0

    _cached_schedules = None
    _cached_schedules_at = 0.0

    _cached_weather = None
    _cached_weather_at = 0.0

    def __init__(self):
        self.supabase: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_KEY:
            self.supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            print(f"[{LOG_NAME}] Supabase connected.")

        self.llm_client = _beeknoee_client()
        if self.llm_client:
            print(f"[{LOG_NAME}] Beeknoee LLM ready. Primary: {settings.BEEKNOEE_LLM_MODEL}")
        else:
            print(f"[{LOG_NAME}] WARNING: No Beeknoee key - keyword-only mode.")

    def _get_dynamic_settings(self) -> Dict[str, Any]:
        """Fetch model and pricing settings from database system_settings table, with local config fallback."""
        import time
        now = time.time()
        if RAGService._cached_settings and (now - RAGService._cached_at < 30):
            return RAGService._cached_settings

        config = {
            "model": settings.BEEKNOEE_LLM_MODEL,
            "input_cost": settings.BEEKNOEE_INPUT_COST_PER_1M,
            "output_cost": settings.BEEKNOEE_OUTPUT_COST_PER_1M,
            "embed_model": settings.BEEKNOEE_EMBED_MODEL,
            "embed_cost": settings.BEEKNOEE_EMBED_COST_PER_1M,
        }

        if not self.supabase:
            return config

        try:
            res = self.supabase.table("system_settings").select("*").execute()
            if res.data:
                for row in res.data:
                    key = row["key"]
                    val = row["value"]
                    if key == "BEEKNOEE_LLM_MODEL":
                        config["model"] = val
                    elif key == "BEEKNOEE_EMBED_MODEL":
                        config["embed_model"] = val
                    elif key == "BEEKNOEE_INPUT_COST_PER_1M":
                        config["input_cost"] = float(val)
                    elif key == "BEEKNOEE_OUTPUT_COST_PER_1M":
                        config["output_cost"] = float(val)
                    elif key == "BEEKNOEE_EMBED_COST_PER_1M":
                        config["embed_cost"] = float(val)
                RAGService._cached_settings = config
                RAGService._cached_at = now
        except Exception as e:
            print(f"[{LOG_NAME}] Failed to fetch dynamic settings from database system_settings: {e}")

        return config

    # ─── Context Retrieval ────────────────────────────────────────────────────

    def retrieve_context(self, question: str, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks from Supabase.
        Strategy: pgvector semantic search + diacritics-normalized keyword search fallback.
        """
        if not self.supabase:
            return []

        vector_results = []
        # 1. Semantic vector search
        try:
            query_embedding = embedding_service.normalize_embedding_dim(
                embedding_service.generate_embedding(question)
            )
            res = self.supabase.rpc("match_chunks", {
                "query_embedding": query_embedding,
                "match_threshold": 0.28,
                "match_count": limit,
                "filter_visibility": "public"
            }).execute()

            if res.data:
                for row in res.data:
                    try:
                        similarity = float(row.get("similarity", 0.0))
                    except (ValueError, TypeError):
                        similarity = 0.0
                    vector_results.append({
                        "id": row.get("id"),
                        "article_id": row.get("article_id"),
                        "text": row.get("chunk_text", ""),
                        "metadata": row.get("metadata", {}),
                        "similarity": similarity,
                    })
                print(f"[{LOG_NAME}] Vector search: {len(vector_results)} chunks.")
        except Exception as e:
            print(f"[{LOG_NAME}] Vector search failed: {e}")

        # If we have enough vector results, return them directly
        if len(vector_results) >= limit:
            return vector_results

        # 2. Keyword fallback to fill remaining slots
        keyword_results = self._keyword_search(question, limit)
        
        # Merge vector results and keyword results
        combined_results = list(vector_results)
        seen_chunk_ids = {str(c["id"]) for c in vector_results if c.get("id")}
        
        for kw_chunk in keyword_results:
            chunk_id = str(kw_chunk.get("id"))
            if chunk_id not in seen_chunk_ids:
                combined_results.append(kw_chunk)
                seen_chunk_ids.add(chunk_id)
                if len(combined_results) >= limit:
                    break
                    
        return combined_results

    def _keyword_search(self, question: str, limit: int) -> List[Dict[str, Any]]:
        """Score chunks by keyword frequency across title + chunk_text with diacritics normalization."""
        if not self.supabase:
            return []
        try:
            words = [w for w in re.findall(r'\w+', question.lower()) if len(w) > 2]
            if not words:
                return []

            # Retrieve all knowledge chunks and join with knowledge_articles
            res = self.supabase.table("knowledge_chunks") \
                .select("id, article_id, chunk_text, metadata, knowledge_articles(visibility, status, title, category, source)") \
                .execute()

            if not res.data:
                return []

            words_no_accent = [remove_accents(w) for w in words]
            scored = []

            for row in res.data:
                article = row.get("knowledge_articles")
                if not article:
                    continue
                # Ensure the article is public and published
                if article.get("visibility") != "public" or article.get("status") != "published":
                    continue

                chunk_text = row.get("chunk_text", "")
                title = article.get("title", "") or row.get("metadata", {}).get("title", "")

                chunk_text_l = chunk_text.lower()
                title_l = title.lower()

                chunk_text_l_no_accent = remove_accents(chunk_text_l)
                title_l_no_accent = remove_accents(title_l)

                score = 0
                for w, w_na in zip(words, words_no_accent):
                    # Accented match (higher weight for title)
                    score += title_l.count(w) * 4
                    score += chunk_text_l.count(w)
                    # Non-accented match (fallback for typo/accent variations)
                    score += title_l_no_accent.count(w_na) * 2
                    score += chunk_text_l_no_accent.count(w_na)

                if score > 0:
                    scored.append((score, row, title, article))

            if not scored:
                return []

            scored.sort(key=lambda x: x[0], reverse=True)
            max_score = scored[0][0] if scored else 1

            results = []
            for score, row, title, article in scored[:limit]:
                # Calculate similarity score based on normalized keyword frequency score
                similarity = round(min(0.85, (score / max_score) * 0.85), 3)
                results.append({
                    "id": row.get("id"),
                    "article_id": row.get("article_id"),
                    "text": row.get("chunk_text", ""),
                    "metadata": {
                        "title": title,
                        "category": article.get("category", "khac"),
                        "source": article.get("source"),
                    },
                    "similarity": similarity,
                })

            print(f"[{LOG_NAME}] Keyword search on chunks: {len(results)} chunks.")
            return results
        except Exception as e:
            print(f"[{LOG_NAME}] Keyword search on chunks failed: {e}")
            return []

    # ─── Language Detection & Translation ──────────────────────────────────────

    def _detect_language(self, question: str) -> Dict[str, str]:
        """
        Detect language code and English name offline using langdetect.
        Falls back to 'vi' on error or empty text.
        """
        default_lang = {"code": "vi", "name": "Vietnamese"}
        cleaned_question = question.strip()
        if not cleaned_question:
            return default_lang

        # Basic LANG_MAP
        LANG_MAP = {
            "vi": "Vietnamese",
            "en": "English",
            "km": "Khmer",
            "ko": "Korean",
            "ja": "Japanese",
            "zh-cn": "Chinese",
            "zh-tw": "Chinese",
            "zh": "Chinese",
            "fr": "French",
            "de": "German",
            "es": "Spanish",
            "ru": "Russian",
            "th": "Thai",
            "lo": "Lao",
        }

        try:
            from langdetect import detect
            code = detect(cleaned_question)
            if code:
                code = code.strip().lower()
                # Normalize zh codes
                if code.startswith("zh"):
                    code = "zh"
                name = LANG_MAP.get(code, code.upper())
                return {"code": code, "name": name}
        except Exception as e:
            print(f"[{LOG_NAME}] Offline language detection error: {e}")
            
        return default_lang

    def _translate_no_info_response(self, language_name: str) -> str:
        """Translate the standard 'no information' response into the target language using LLM."""
        default_en = (
            f"Currently, {CRAWBOT_NAME} does not have approved information on this topic. "
            "Please contact the Management Board via phone at (0276) 3823.378 for direct assistance."
        )
        if not self.llm_client:
            return default_en

        prompt = (
            f"Translate the following text into {language_name}. "
            "Return ONLY the translated text. Do not add any greetings, introductory text, explanations, or quotes."
        )
        try:
            dyn_config = self._get_dynamic_settings()
            translated, _ = _call_llm(
                client=self.llm_client,
                system_prompt=prompt,
                user_question=default_en,
                model=dyn_config["model"],
                input_cost_per_1m=dyn_config["input_cost"],
                output_cost_per_1m=dyn_config["output_cost"],
                temperature=0.2,
                max_tokens=150,
            )
            if translated:
                return translated.strip()
        except Exception as e:
            print(f"[{LOG_NAME}] Failed to translate no-info response: {e}")
        return default_en

    # ─── No-Info Response ─────────────────────────────────────────────────────

    def _no_info_response(self, language: str) -> str:
        if language == "km":
            return (
                f"បច្ចុប្បន្ន {CRAWBOT_NAME} មិនទាន់មានព័ត៌មានផ្លូវការអំពីប្រធានបទនេះទេ។ "
                "សូមទាក់ទងគណៈគ្រប់គ្រងតាមរយៈលេខទូរស័ព្ទ (0276) 3823.378 សម្រាប់ជំនួយផ្ទាល់។"
            )
        if language == "en":
            return (
                f"Currently, {CRAWBOT_NAME} does not have approved information on this topic. "
                "Please contact the Management Board via phone at (0276) 3823.378 for direct assistance."
            )
        return (
            f"Hiện {CRAWBOT_NAME} chưa có thông tin chính thức về nội dung này. "
            "Quý khách vui lòng liên hệ Ban Quản lý qua số điện thoại (0276) 3823.378 để được hỗ trợ."
        )

    # ─── Main Ask Pipeline ────────────────────────────────────────────────────

    def _small_talk_response(self, question: str, language: str) -> Optional[str]:
        normalized = re.sub(r"[^\w\s]", " ", question.lower()).strip()
        normalized = re.sub(r"\s+", " ", normalized)
        
        greetings_map = {
            "vi": {"xin chao", "chao", "hello", "hi", "alo", "cam on", "cảm ơn", "thanks"},
            "en": {"hello", "hi", "thanks", "thank you", "good morning", "good afternoon"},
            "km": {"suosdei", "chao", "hello", "hi", "alo", "akun", "thanks", "thank you"},
            "ko": {"안녕하세요", "안녕", "감사합니다", "고맙습니다"},
            "ja": {"こんにちは", "ありがとう", "ありがとうございます"},
            "zh": {"你好", "谢谢", "謝謝"}
        }
        
        is_greeting = False
        matched_lang = None
        for lang, words in greetings_map.items():
            if normalized in words:
                is_greeting = True
                matched_lang = lang
                break

        if is_greeting:
            target_lang = language if language in {"vi", "en", "km", "ko", "ja", "zh"} else (matched_lang or "en")
            
            if target_lang == "ko":
                return "안녕하세요. 케이블카 티켓, 운영 시간, 이동 경로, 사찰 에티켓, 주요 명소 및 공식 안내 사항에 대한 정보를 제공해 드릴 수 있습니다. 무엇을 도와드릴까요?"
            if target_lang == "ja":
                return "こんにちは。ケーブルカーのチケット、営業時間、ルート、寺院の参拝マナー、観光スポット、公式案内などについてご案内できます。どのような情報がお知りになりたいですか？"
            if target_lang == "zh":
                return "您好！我可以为您提供关于缆车门票、开放时间、游览路线、寺庙礼仪、景点介绍以及官方通知等信息。请问有什么我可以帮您的？"
            if target_lang == "km":
                return "សួស្តីបង។ ខ្ញុំអាចជួយផ្តល់ព័ត៌មានអំពីតម្លៃសំបុត្រឡានកាប ម៉ោងបើកធ្វើការ ផ្លូវធ្វើដំណើរ បទប្បញ្ញត្តិទស្សនា កន្លែងទេសចរណ៍ និងសេចក្តីជូនដំណឹងផ្លូវការ។ តើបងចង់សួរអំពីខ្លឹមសារអ្វីដែរ?"
            if target_lang == "en":
                return "Hello. I can help with cable car tickets, opening hours, directions, temple etiquette, attractions, and official visitor notices. What would you like to know?"
            return "Chào anh/chị. Mình có thể hỗ trợ thông tin về giá vé cáp treo, giờ hoạt động, đường đi, quy định tham quan, điểm tham quan và thông báo chính thức. Anh/chị muốn hỏi nội dung nào?"
        return None

    def _format_conversation_history(self, conversation_history: Optional[List[Dict[str, Any]]]) -> str:
        if not conversation_history:
            return ""

        lines = []
        for item in conversation_history[-8:]:
            role = item.get("role")
            content = str(item.get("content", "")).strip()
            if role not in {"user", "assistant"} or not content:
                continue
            label = "Du khách" if role == "user" else CRAWBOT_NAME
            lines.append(f"{label}: {content[:800]}")

        if not lines:
            return ""
        return "\n\nNgữ cảnh hội thoại trước đó:\n" + "\n".join(lines)

    def ask(
        self,
        question: str,
        user_id: UUID = None,
        channel: str = "mini_app",
        language: str = "vi",
        conversation_history: Optional[List[Dict[str, Any]]] = None,
    ) -> ChatResponse:
        """
        CrawBot Q&A pipeline:
        1. Retrieve context from Supabase (vector → keyword)
        2. Generate answer via Beeknoee LLM with fallback chain
        3. Log conversation to Supabase chat_logs
        """
        # Auto-detect language of the question
        detected_info = self._detect_language(question)
        detected_code = detected_info["code"]
        detected_name = detected_info["name"]

        # Check if we should override manual language selection
        # (Auto-detect activates if dropdown is 'auto', the default 'vi', OR if the user's question language is not vi, en, or km)
        if language in {"auto", "vi"}:
            resolved_lang = detected_code
            resolved_lang_name = detected_name
            print(f"[{LOG_NAME}] Dropdown is default/auto '{language}'. Auto-detected language: {resolved_lang} ({resolved_lang_name})")
        else:
            if detected_code not in {"vi", "en", "km"}:
                resolved_lang = detected_code
                resolved_lang_name = detected_name
                print(f"[{LOG_NAME}] Question in non-supported language '{detected_code}' auto-activates language detection (overrides manual '{language}').")
            else:
                resolved_lang = language
                lang_names_map = {"vi": "Vietnamese", "en": "English", "km": "Khmer"}
                resolved_lang_name = lang_names_map.get(language, "Vietnamese")
                print(f"[{LOG_NAME}] Respecting manual selection: {resolved_lang} ({resolved_lang_name})")

        language = resolved_lang
        language_name = resolved_lang_name

        # history_context and question_with_context are removed; history is passed natively in messages

        # Lấy thông tin cá nhân hóa của du khách để nhúng vào hệ thống chatbot
        personalization_str = ""
        if self.supabase and user_id:
            try:
                user_res = self.supabase.table("app_users").select("name").eq("id", str(user_id)).execute()
                if user_res.data:
                    user_name = user_res.data[0].get("name")
                    if user_name:
                        personalization_str += f"\n- Du khách tên là: {user_name}. Hãy xưng hô chào đón hoặc trả lời thân mật có gọi tên họ khi bắt đầu câu trả lời nếu thấy phù hợp."
                
                # Lấy địa danh ưa thích của du khách
                fav_res = self.supabase.table("user_favorites").select("place_id, tourist_places(name)").eq("user_id", str(user_id)).execute()
                if fav_res.data:
                    fav_names = []
                    for f in fav_res.data:
                        if f.get("tourist_places") and f["tourist_places"].get("name"):
                            fav_names.append(f["tourist_places"]["name"])
                    if fav_names:
                        fav_places = ", ".join(fav_names)
                        personalization_str += f"\n- Du khách này đã lưu các địa danh sau vào mục yêu thích: {fav_places}. Bạn có thể liên hệ hoặc gợi ý thêm các hoạt động phù hợp liên quan đến các địa danh này."
            except Exception as pe:
                print(f"[{LOG_NAME}] Personalization lookup failed: {pe}")

        small_talk = self._small_talk_response(question, language)
        if small_talk:
            return ChatResponse(
                answer=small_talk,
                confidence_score=1.0,
                sources=[],
            )

        # Fetch active announcements to dynamically feed to chatbot context
        announcements_str = ""
        import time
        now = time.time()
        
        # Fetch announcements for all questions in the conversation to maintain up-to-date context
        if self.supabase:
            if RAGService._cached_announcements is not None and (now - RAGService._cached_announcements_at < CACHE_TTL):
                announcements_str = RAGService._cached_announcements
            else:
                try:
                    ann_res = self.supabase.table("announcements").select("*").eq("status", "published").execute()
                    if ann_res.data:
                        parts = []
                        for idx, ann in enumerate(ann_res.data, 1):
                            title = ann.get("title", "")
                            content = ann.get("content", "")
                            ann_type = ann.get("type", "general")
                            parts.append(f"[Thông báo & Cảnh báo số {idx} - Loại: {ann_type} - Tiêu đề: {title}]\nNội dung: {content}")
                        announcements_str = "\n\n---\n\n".join(parts)
                    RAGService._cached_announcements = announcements_str
                    RAGService._cached_announcements_at = now
                except Exception as ann_err:
                    print(f"[{LOG_NAME}] Failed to fetch announcements for context: {ann_err}")
                    # If database fails, fallback to expired cache if available
                    if RAGService._cached_announcements is not None:
                        announcements_str = RAGService._cached_announcements

        # Fetch dynamic cable car schedules and weather from database
        schedules_json_str = ""
        weather_status = "sunny"
        weather_temp = "30"
        
        if self.supabase:
            # 1. Schedules Cache
            if RAGService._cached_schedules is not None and (now - RAGService._cached_schedules_at < CACHE_TTL):
                schedules_json_str = RAGService._cached_schedules
            else:
                try:
                    schedule_res = self.supabase.table("knowledge_articles").select("content").eq("id", "a1c3d359-fe2c-42da-9d19-d94dfcedb022").execute()
                    if schedule_res.data:
                        import json
                        raw_content = schedule_res.data[0].get("content", "")
                        try:
                            parsed = json.loads(raw_content)
                            if "schedules" in parsed:
                                schedules_json_str = json.dumps(parsed["schedules"], ensure_ascii=False, indent=2)
                            else:
                                schedules_json_str = raw_content
                        except Exception:
                            schedules_json_str = raw_content
                    RAGService._cached_schedules = schedules_json_str
                    RAGService._cached_schedules_at = now
                except Exception as e:
                    print(f"[{LOG_NAME}] Failed to fetch schedules for general chat: {e}")
                    if RAGService._cached_schedules is not None:
                        schedules_json_str = RAGService._cached_schedules

            # 2. Weather Cache
            if RAGService._cached_weather is not None and (now - RAGService._cached_weather_at < CACHE_TTL):
                weather_status, weather_temp = RAGService._cached_weather
            else:
                try:
                    # Fetch weather settings from database
                    weather_res = self.supabase.table("system_settings").select("key, value").in_("key", ["REALTIME_WEATHER_STATUS", "REALTIME_WEATHER_TEMP"]).execute()
                    if weather_res.data:
                        for row in weather_res.data:
                            if row["key"] == "REALTIME_WEATHER_STATUS":
                                weather_status = row["value"]
                            elif row["key"] == "REALTIME_WEATHER_TEMP":
                                weather_temp = row["value"]
                    RAGService._cached_weather = (weather_status, weather_temp)
                    RAGService._cached_weather_at = now
                except Exception as e:
                    print(f"[{LOG_NAME}] Failed to fetch weather for general chat: {e}")
                    if RAGService._cached_weather is not None:
                        weather_status, weather_temp = RAGService._cached_weather

        if not schedules_json_str:
            schedules_json_str = """[
  {
    "title": "Tuyến Đỉnh Vân Sơn",
    "items": [
      {"label": "Thứ 2 - Thứ 6", "hours": "07:00 - 18:00"},
      {"label": "Thứ 7 - Chủ Nhật", "hours": "06:00 - 21:00", "note": "Ngắm led đỉnh núi ban đêm"}
    ]
  },
  {
    "title": "Tuyến Chùa Hang ( Khu vực Chùa Bà - Điện Bà)",
    "items": [
      {"label": "Thứ 2 - Thứ 6", "hours": "06:00 - 18:00"},
      {"label": "Thứ 7 - Chủ Nhật", "hours": "05:30 - 22:00"}
    ]
  },
  {
    "title": "Tuyến Tâm An ( Kết nối Đỉnh núi và Chùa Bà)",
    "items": [
      {"label": "Thứ 2 - Thứ 6", "note": "Đóng cửa"},
      {"label": "Thứ 7 - Chủ Nhật", "hours": "06:00 - 19:00"}
    ]
  }
]"""

        chunks = self.retrieve_context(question)
        answer = ""
        confidence_score = 0.0
        sources: List[SourceCitation] = []
        usage_data = {
            "model": None,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "estimated_cost_usd": 0.0,
        }

        if not chunks and not announcements_str:
            if language in {"vi", "en", "km"}:
                answer = self._no_info_response(language)
            else:
                answer = self._translate_no_info_response(language_name)
            confidence_score = 0.0
        else:
            # Build deduplicated source list
            seen: set = set()
            for chunk in chunks:
                aid = str(chunk.get("article_id", ""))
                if aid and aid not in seen:
                    seen.add(aid)
                    sources.append(SourceCitation(
                        article_id=UUID(aid),
                        title=chunk["metadata"].get("title", "Tài liệu chính thức"),
                        category=chunk["metadata"].get("category", "khac"),
                        source=chunk["metadata"].get("source"),
                    ))

            if chunks:
                confidence_score = chunks[0]["similarity"]
            else:
                confidence_score = 0.90 # High confidence for matching active announcements

            if self.llm_client:
                # Get local current date and time (Vietnam GMT+7)
                from datetime import datetime, timezone, timedelta
                vn_tz = timezone(timedelta(hours=7))
                now_vn = datetime.now(vn_tz)
                
                # Weekdays translations
                weekdays_vi = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
                weekdays_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                weekdays_km = ["ថ្ងៃច័ន្ទ", "ថ្ងៃអង្គារ", "ថ្ងៃពុធ", "ថ្ងៃព្រហស្បតិ៍", "ថ្ងៃសុក្រ", "ថ្ងៃសៅរ៍", "ថ្ងៃអាទិត្យ"]
                
                current_date_str = now_vn.strftime("%d/%m/%Y")
                current_time_str = now_vn.strftime("%H:%M")

                try:
                    weather_temp_val = float(weather_temp)
                except Exception:
                    weather_temp_val = 30.0

                # Check if we should include weather alerts (first turn or explicitly asking)
                def asks_about_weather_or_clothing(q: str) -> bool:
                    q_l = q.lower()
                    keywords = {
                        "thời tiết", "nắng", "mưa", "nhiệt độ", "gió", "lạnh", "nóng", "khuyên", "cảnh báo thời tiết",
                        "áo mưa", "mang gì", "mặc gì", "mang theo", "ô", "dù", "giày", "trang phục", "chuẩn bị gì",
                        "weather", "rain", "sun", "temp", "temperature", "wind", "cold", "hot", "apparel", "wear",
                        "clothing", "clothes", "umbrella", "raincoat", "shoes", "jacket", "forecast", "climate",
                        "អាកាសធាតុ", "ភ្លៀង", "ថ្ងៃក្តៅ", "ខ្យល់", "សម្លៀកបំពាក់", "ឆ័ត្រ", "អាវភ្លៀង", "ស្បែកជើង"
                    }
                    return any(kw in q_l for kw in keywords)

                is_first_question = not conversation_history or len(conversation_history) == 0
                include_weather_warnings = is_first_question or asks_about_weather_or_clothing(question)

                if language == "en" or language not in {"vi", "km"}:
                    weather_status_desc = {
                        "sunny": "Sunny",
                        "cloudy": "Cloudy",
                        "rainy": "Rainy",
                        "windy": "Windy"
                    }.get(weather_status, weather_status)
                    
                    weather_rules = ""
                    if include_weather_warnings:
                        if weather_status in ["rainy", "windy"]:
                            weather_rules = (
                                f"\n- WEATHER SAFETY ALERT: The current weather is {weather_status_desc}. "
                                f"Advise the visitor to bring an umbrella/raincoat, wear high-grip shoes to prevent slipping on temple stone steps, "
                                f"and beware of strong wind gusts at the peak. Warn them that the Alpine Coaster (máng trượt) and cable cars "
                                f"may run slower or temporarily suspend operations for safety. Suggest sightseeing by cable car or indoors."
                            )
                        elif weather_temp_val >= 32.0:
                            weather_rules = (
                                f"\n- WEATHER SAFETY ALERT: The current temperature is hot ({weather_temp_val}°C). "
                                f"Advise the visitor to wear a hat/cap, apply sunscreen, and carry enough water to stay hydrated."
                            )

                    current_weekday = weekdays_en[now_vn.weekday()]
                    time_and_schedule_context = (
                        f"[REAL-TIME SYSTEM TIME & CABLE CAR OPERATING SCHEDULE]\n"
                        f"- Current system date: {current_weekday}, {current_date_str}\n"
                        f"- Current weather: {weather_status_desc}, {weather_temp}°C{weather_rules}\n"
                        f"- Cable Car schedules loaded dynamically from database:\n"
                        f"{schedules_json_str}\n"
                        f"- Routing logic rules during maintenance/closures:\n"
                        f"  + Travel from Ba Temple to the Peak on weekdays: Since Tam An line is closed, visitors must take Chua Hang line down to the Ground, then take Van Son line to the Peak.\n"
                        f"  + Travel from Ba Temple to the Peak on weekends: Visitors can take Tam An line directly.\n"
                        f"  + If a line is undergoing maintenance or suspended per [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT], guide the visitor to take another route. E.g., if Van Son is closed on weekends, guide them to take Chua Hang to Ba Temple, then Tam An to the Peak. If Van Son is closed on weekdays, inform them that the Peak is currently unreachable and suggest visiting Ba Temple instead.\n"
                    )
                elif language == "km":
                    weather_status_desc = {
                        "sunny": "មេឃស្រឡះ",
                        "cloudy": "មេឃមានពពក",
                        "rainy": "មានភ្លៀងធ្លាក់",
                        "windy": "មានខ្យល់បក់ខ្លាំង"
                    }.get(weather_status, weather_status)
                    
                    weather_rules = ""
                    if include_weather_warnings:
                        if weather_status in ["rainy", "windy"]:
                            weather_rules = (
                                f"\n- ការព្រមានអំពីសុវត្ថិភាពអាកាសធាតុ៖ អាកាសធាតុបច្ចុប្បន្នគឺ {weather_status_desc}។ "
                                f"ណែនាំភ្ញៀវឱ្យត្រៀមឆ័ត្រ/អាវភ្លៀង ពាក់ស្បែកជើងដែលមានភាពស្អិតល្អដើម្បីការពារការរអិលលើកាំជណ្តើរថ្មនៅវត្តលោកយាយ និងប្រុងប្រយ័ត្នខ្យល់បោកបក់ខ្លាំងនៅកំពូលភ្នំ។ "
                                f"ព្រមានពួកគេថាម៉ាស៊ីនរអិល (Alpine Coaster) និងឡានកាបអាចដំណើរការយឺតជាងមុន ឬផ្អាកដំណើរការជាបណ្តោះអាសន្នដើម្បីសុវត្ថិភាព។ ណែនាំឱ្យទស្សនាតามឡានកាប ឬក្នុងផ្ទះ។"
                            )
                        elif weather_temp_val >= 32.0:
                            weather_rules = (
                                f"\n- ការព្រមានអំពីសុវត្ថិភាពអាកាសធាតុ៖ សីតុណ្ហភាពបច្ចុប្បន្នគឺក្តៅខ្លាំង ({weather_temp_val}°C)។ "
                                f"ណែនាំឱ្យពាក់មួក លាបឡេការពារកម្តៅថ្ងៃ និងផឹកទឹកឱ្យបានគ្រប់គ្រាន់។"
                            )

                    current_weekday = weekdays_km[now_vn.weekday()]
                    time_and_schedule_context = (
                        f"[ព័ត៌មានពេលវេលាប្រព័ន្ធផ្ទាល់ & កាលវិភាគប្រតិបត្តិការឡានកាប]\n"
                        f"- ថ្ងៃទីប្រព័ន្ធបច្ចុប្បន្ន៖ {current_weekday}, {current_date_str}\n"
                        f"- ស្ថានភាពអាកាសធាតុបច្ចុប្បន្ន៖ {weather_status_desc}, {weather_temp}°C{weather_rules}\n"
                        f"- កាលវិភាគឡានកាបមកពីមូលដ្ឋានទិន្នន័យ៖\n"
                        f"{schedules_json_str}\n"
                        f"- តក្កវិជ្ជានៃការបង្វែរទិសដៅសម្រាប់ស្ថានភាពថែទាំ/បិទទ្វារ៖\n"
                        f"  + ធ្វើដំណើរពីវត្តលោកយាយទៅកំពូលភ្នំនៅថ្ងៃធម្មតា៖ ដោយសារខ្សែឡានកាប Tâm An បិទ ភ្ញៀវត្រូវចុះទៅជើងភ្នំតាមខ្សែ Chùa Hang រួចឡើងកំពូលភ្នំតាមខ្សែ Vân Sơn។\n"
                        f"  + ធ្វើដំណើរពីវត្តលោកយាយទៅកំពូលភ្នំនៅចុងសប្តាហ៍៖ អាចធ្វើដំណើរដោយផ្ទាល់តាមខ្សែឡានកាប Tâm An។\n"
                        f"  + ប្រសិនបើខ្សែឡានកាបណាមួយត្រូវបានផ្អាក/ថែទាំតាម [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT] ត្រូវណែនាំភ្ញៀវឱ្យប្រើប្រាស់ផ្លូវផ្សេង។ ឧទាហរណ៍៖ ប្រសិនបើ Vân Sơn ថែទាំនៅចុងសប្តាហ៍ ណែនាំឱ្យជិះ Chùa Hang ទៅវត្តលោកយាយ រួចជិះ Tâm An ឡើងកំពូលភ្នំ។ ប្រសិនបើ Vân Sơn ថែទាំនៅថ្ងៃធម្មតា ត្រូវប្រាប់ថាបច្ចុប្បន្នមិនអាចឡើងកំពូលភ្នំបានទេ ហើយណែនាំឱ្យទៅទស្សនាវត្តលោកយាយជំនួសវិញ។\n"
                    )
                else:
                    weather_status_desc = {
                        "sunny": "Nắng ráo",
                        "cloudy": "Nhiều mây",
                        "rainy": "Có mưa",
                        "windy": "Có gió mạnh"
                    }.get(weather_status, weather_status)
                    
                    weather_rules = ""
                    if include_weather_warnings:
                        if weather_status in ["rainy", "windy"]:
                            weather_rules = (
                                f"\n- CẢNH BÁO AN TOÀN THỜI TIẾT: Thời tiết hiện tại là {weather_status_desc}. "
                                f"Nhắc nhở du khách chuẩn bị ô/áo mưa, đi giày có độ bám tốt để tránh trơn trượt trên các bậc đá tại Chùa Bà, và lưu ý máng trượt (Alpine Coaster) cùng cáp treo có thể vận hành chậm hơn hoặc tạm dừng hoạt động ngắn hạn để đảm bảo an toàn. Khuyên du khách nên ưu tiên tham quan bằng cáp treo hoặc trong nhà."
                            )
                        elif weather_temp_val >= 32.0:
                            weather_rules = (
                                f"\n- CẢNH BÁO AN TOÀN THỜI TIẾT: Thời tiết hiện tại đang nắng nóng ({weather_temp_val}°C). "
                                f"Nhắc nhở du khách chuẩn bị mũ/nón, kem chống nắng và chuẩn bị đủ nước uống."
                            )

                    current_weekday = weekdays_vi[now_vn.weekday()]
                    time_and_schedule_context = (
                        f"[THÔNG TIN THỜI GIAN THỰC TẾ & LỊCH HOẠT ĐỘNG CÁP TREO]\n"
                        f"- Ngày hiện tại của hệ thống: {current_weekday}, ngày {current_date_str}\n"
                        f"- Thời tiết hiện tại: {weather_status_desc}, {weather_temp}°C{weather_rules}\n"
                        f"- Lịch hoạt động các tuyến cáp đọc từ cơ sở dữ liệu:\n"
                        f"{schedules_json_str}\n"
                        f"- Quy tắc điều hướng dự phòng khi có bảo trì/đóng cửa:\n"
                        f"  + Đi từ Chùa Bà lên Đỉnh núi ngày thường: Do cáp Tâm An đóng cửa ngày thường, du khách phải đi cáp Chùa Hang (hoặc máng trượt/leo bộ) xuống Chân núi, sau đó đi cáp Vân Sơn lên Đỉnh.\n"
                        f"  + Đi từ Chùa Bà lên Đỉnh núi cuối tuần: Có thể đi thẳng bằng cáp Tâm An.\n"
                        f"  + Nếu một tuyến cáp bị bảo trì/dừng chạy khẩn cấp theo [THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT], bạn phải hướng dẫn du khách đi tuyến khác. Ví dụ: Nếu cáp Vân Sơn bảo trì vào cuối tuần, hướng dẫn đi cáp Chùa Hang lên Chùa Bà rồi đi cáp Tâm An lên Đỉnh. Nếu cáp Vân Sơn bảo trì vào ngày thường, thông báo rõ là hiện tại không thể lên đỉnh núi (vì cáp Tâm An cũng đóng cửa ngày thường) và gợi ý tham quan Chùa Bà.\n"
                    )

                # Build context block
                context_parts = []
                context_parts.append(time_and_schedule_context)
                if announcements_str:
                    context_parts.append("[THÔNG BÁO QUAN TRỌNG & CẢNH BÁO MỚI NHẤT ĐANG DIỄN RA TẠI DI TÍCH NÚI BÀ ĐEN]\n" + announcements_str)

                for i, chunk in enumerate(chunks, 1):
                    title = chunk["metadata"].get("title", f"Tài liệu {i}")
                    context_parts.append(f"[Tài liệu {i} — {title}]\n{chunk['text']}")
                context_str = "\n\n---\n\n".join(context_parts)

                if language in {"vi", "en", "km"}:
                    sys_prompt_base = SYSTEM_PROMPT_KM if language == "km" else SYSTEM_PROMPT_EN if language == "en" else SYSTEM_PROMPT_VI
                else:
                    sys_prompt_base = SYSTEM_PROMPT_TEMPLATE.replace("{language_name}", language_name)

                if personalization_str:
                    sys_prompt_base = sys_prompt_base.replace("Tài liệu tham khảo:", f"Thông tin du khách & Cá nhân hóa:{personalization_str}\n\nTài liệu tham khảo:")
                    sys_prompt_base = sys_prompt_base.replace("Reference documents:", f"Visitor profile & Personalization:{personalization_str}\n\nReference documents:")
                    sys_prompt_base = sys_prompt_base.replace("ឯកសារយោង:", f"ព័ត៌មានផ្ទាល់ខ្លួនរបស់ភ្ញៀវ & បុគ្គលិកលក្ខណៈ:{personalization_str}\n\nឯកសារយោង:")

                prompt = sys_prompt_base.format(
                    name=CRAWBOT_NAME,
                    context=context_str,
                )

                if channel == "zalo_bot":
                    zalo_formatting_instruction = (
                        "\n\n[ZALO BOT FORMATTING RULES]\n"
                        "- Keep your response concise. Strictly keep your entire answer under 1500 characters (prefer ~1000 characters) to ensure it fits on a single mobile screen and does not get split.\n"
                        "- Use Markdown formatting like **bold** (for prices, times, place names, or critical warnings) to make your response neat and professional.\n"
                        "- Use bullet points or ordered lists to break down information.\n"
                        "- You can use Zalo-specific color tags: {red}text{/red}, {green}text{/green}, {orange}text{/orange}, {yellow}text{/yellow} to highlight important notices or warnings.\n"
                        "- You can use {big}text{/big} for emphasis, and {underline}text{/underline} to underline key terms.\n"
                        "- DO NOT use standard markdown link format like `[Label](URL)`. Instead, write raw links directly, e.g., `Label (URL)` or `Label: URL`."
                    )
                    prompt += zalo_formatting_instruction

                try:
                    dyn_config = self._get_dynamic_settings()
                    # Prepends dynamic hour/minute metadata to the user question so the system prompt remains static
                    cached_user_question = f"[REAL-TIME SYSTEM TIME: {current_time_str}]\nCâu hỏi: {question}"

                    answer, usage_data = _call_llm(
                        client=self.llm_client,
                        system_prompt=prompt,
                        user_question=cached_user_question,
                        model=dyn_config["model"],
                        input_cost_per_1m=dyn_config["input_cost"],
                        output_cost_per_1m=dyn_config["output_cost"],
                        conversation_history=conversation_history,
                    )
                    # If LLM says "no info" → clear sources
                    no_info_markers = [
                        "chưa có thông tin chính xác",
                        "chưa có thông tin chính thức",
                        "không có thông tin chính thức",
                        "không có thông tin",
                        "don't have official information",
                        "does not have approved information",
                        "no official information",
                        "no information",
                        "មិនទាន់មានព័ត៌មានផ្លូវការ",
                        "공식 정보",
                        "정보가 없습니다",
                        "公式情報",
                        "情報はありません",
                        "没有官方信息",
                        "暂无官方信息",
                        "没有相关信息"
                    ]
                    if any(m.lower() in answer.lower() for m in no_info_markers):
                        confidence_score = 0.1
                        sources = []
                except Exception as e:
                    print(f"[{LOG_NAME}] LLM failed: {e}. Using raw chunk.")
                    answer = chunks[0]["text"] if chunks else self._no_info_response(language)
            else:
                # No LLM available — return best matching chunk directly
                answer = chunks[0]["text"] if chunks else self._no_info_response(language)

        # Log to Supabase
        if self.supabase:
            try:
                self.supabase.table("chat_logs").insert({
                    "user_id": str(user_id) if user_id else None,
                    "channel": channel,
                    "question": question,
                    "answer": answer,
                    "source_article_ids": [str(s.article_id) for s in sources],
                    "confidence_score": float(confidence_score),
                    "model": usage_data["model"],
                    "prompt_tokens": usage_data["prompt_tokens"],
                    "completion_tokens": usage_data["completion_tokens"],
                    "total_tokens": usage_data["total_tokens"],
                    "estimated_cost_usd": usage_data["estimated_cost_usd"],
                }).execute()
            except Exception as e:
                print(f"[{LOG_NAME}] Log failed: {e}")

        return ChatResponse(
            answer=answer,
            confidence_score=float(confidence_score),
            sources=sources,
        )


rag_service = RAGService()
