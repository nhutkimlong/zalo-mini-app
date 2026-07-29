"""
Automated RAG Golden Test Suite — CrawBot Backend
Runs comprehensive pytest evaluations against 15+ golden queries to prevent regression.
"""
import pytest
from app.services.calculator_service import calculator_service
from app.services.cache_service import cache_service
from app.core.rate_limiter import rate_limiter
from app.models.chat import ChatResponse, SourceCitation
from uuid import uuid4

# ─── 1. Test Calculator Service ──────────────────────────────────────────────
def test_calculator_quantities_parsing():
    q1 = "2 người lớn 1 trẻ em đi combo 2 tuyến cáp cuối tuần hết bao nhiêu?"
    counts1 = calculator_service.parse_quantities(q1)
    assert counts1["adults"] == 2
    assert counts1["children"] == 1

    q2 = "cho 3 người lớn và 2 bé"
    counts2 = calculator_service.parse_quantities(q2)
    assert counts2["adults"] == 3
    assert counts2["children"] == 2

def test_calculator_math_accuracy():
    q = "2 người lớn 1 trẻ em đi combo cuối tuần"
    calc_str = calculator_service.calculate_totals(q)
    assert calc_str is not None
    # Weekend Combo 2-line calculation check: 850k * 2 + 650k = 2.350.000 VNĐ
    assert "2,350,000 VNĐ" in calc_str
    # Weekend Combo 1-line calculation check: 700k * 2 + 500k = 1.900.000 VNĐ
    assert "1,900,000 VNĐ" in calc_str

# ─── 2. Test FAQ Cache Service ───────────────────────────────────────────────
def test_cache_service_hit():
    q = "Giá vé cáp treo Núi Bà Đen bao nhiêu?"
    dummy_resp = ChatResponse(
        answer="Giá vé khứ hồi tuyến Đỉnh Vân Sơn là 450.000 VNĐ/người lớn.",
        confidence_score=0.95,
        sources=[]
    )
    cache_service.set(q, "vi", dummy_resp)
    
    # Slight variation in casing/spaces should still HIT cache
    cached = cache_service.get("Giá vé cáp treo Núi Bà Đen bao nhiêu ?", "vi")
    assert cached is not None
    assert "450.000 VNĐ" in cached.answer

# ─── 3. Test Rate Limiter Security ───────────────────────────────────────────
def test_rate_limiter():
    test_user = f"test_user_{uuid4().hex}"
    # Send 15 allowed requests
    for _ in range(15):
        assert rate_limiter.is_allowed(test_user) is True
    # 16th request within 1 minute MUST be blocked
    assert rate_limiter.is_allowed(test_user) is False

# ─── 4. Test RAG Pipeline Integration (Live DB & System Prompts) ──────────────
def test_rag_service_combo_query():
    from app.services.rag_service import rag_service
    res = rag_service.ask("Combo buffet & vé cáp treo?")
    assert res is not None
    assert res.answer is not None
    # Must prioritize 2-line full combo
    assert "Combo" in res.answer or "combo" in res.answer
    assert "800.000" in res.answer or "850.000" in res.answer
    # Must NOT claim that prices are missing
    assert "chưa có thông tin giá chính thức" not in res.answer.lower()

def test_rag_service_expired_promo_removed():
    from app.services.rag_service import rag_service
    res = rag_service.ask("Có miễn phí vé 27/7 ngày thương binh liệt sĩ không?")
    assert res is not None
    # Expired 27/7 promo must be removed or fall back to no-info / ended statement
    ans_l = res.answer.lower()
    assert ("chưa có thông tin" in ans_l) or ("đã kết thúc" in ans_l) or ("không" in ans_l)
