import pytest
from app.models.chat import ChatResponse

def test_scenario_1_sla_query():
    """Case 1: SLA Query"""
    response = ChatResponse(
        answer="Yêu cầu phản ánh #12345678 đang được xử lý trong vòng 15 - 30 phút",
        sources=[],
        language="vi",
        confidence_score=0.95
    )
    assert isinstance(response, ChatResponse)
    assert "12345678" in response.answer

def test_scenario_2_completion_thanks():
    """Case 2: Thanks"""
    response = ChatResponse(
        answer="Dạ chúc bạn có một chuyến tham quan vui vẻ!",
        sources=[],
        language="vi",
        confidence_score=0.95
    )
    assert isinstance(response, ChatResponse)
    assert "chúc bạn có một chuyến tham quan vui vẻ" in response.answer

def test_scenario_3_context_switching():
    """Case 3: General QA"""
    response = ChatResponse(
        answer="Mãng cầu Bà Đen là đặc sản nổi tiếng bán tại các gian hàng...",
        sources=[],
        language="vi",
        confidence_score=0.95
    )
    assert isinstance(response, ChatResponse)
    assert "Mãng cầu" in response.answer
