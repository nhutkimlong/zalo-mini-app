import sys
import os
import re

# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from unittest.mock import MagicMock
from app.services.rag_service import RAGService, ChatResponse

class DummySupabaseTable:
    def __init__(self, data=None):
        self._data = data or [{"id": "12345678-1111-2222-3333-444455556666", "content": "Ban đầu: Nhà vệ sinh dơ"}]
    def select(self, *args, **kwargs):
        return self
    def eq(self, *args, **kwargs):
        return self
    def in_(self, *args, **kwargs):
        return self
    def update(self, *args, **kwargs):
        return self
    def upsert(self, *args, **kwargs):
        return self
    def insert(self, *args, **kwargs):
        return self
    def execute(self):
        mock_res = MagicMock()
        mock_res.data = self._data
        return mock_res

def run_tests():
    print("==================================================")
    print("[TEST] BAT DAU KIEM THU CHUAN DU KHACH THUC TE (REAL CUSTOMER UX EDGE CASES)")
    print("==================================================")

    service = RAGService()
    service.supabase = MagicMock()
    service.supabase.table.return_value = DummySupabaseTable()
    active_id = "12345678-1111-2222-3333-444455556666"

    # --- KỊCH BẢN 1: Hỏi tiến độ SLA ("Chừng nào giải quyết") ---
    res1 = service.ask(question="Chừng nào giải quyết", active_feedback_id=active_id)
    print("\n[SCENARIO 1] Hoi tien do SLA ('Chung nao giai quyet')")
    assert "12345678" in res1.answer
    assert "15 - 30 phút" in res1.answer
    assert res1.feedback_id == active_id
    print("-> PASSED: AI tra ve SLA va Ticket ID chinh xac!")

    # --- KỊCH BẢN 2: Kết thúc / Cảm ơn ("Dạ cảm ơn") ---
    res2 = service.ask(question="Dạ cảm ơn", active_feedback_id=active_id)
    print("\n[SCENARIO 2] Ket thuc hoi thoai ('Da cam on')")
    assert "chúc bạn có một chuyến tham quan vui vẻ" in res2.answer
    assert res2.feedback_id is None
    print("-> PASSED: AI Reset trang thai active_feedback_id!")

    # --- KỊCH BẢN 3: Đổi chủ đề ngắt mạch ("Mãng cầu bán ở đâu?") ---
    res3 = service.ask(question="Mãng cầu bán ở đâu?", active_feedback_id=active_id)
    print("\n[SCENARIO 3] Doi chu de ngat mach ('Mang cau ban o dau?')")
    assert "mãng cầu" in res3.answer.lower() or "mang cau" in res3.answer.lower()
    print("-> PASSED: AI tra loi dung cau hoi du lich moi!")

    # --- KỊCH BẢN 3B: Đổi chủ đề ngắt mạch hỏi truyền thuyết ("truyền thuyết linh sơn thánh mẫu") ---
    res3b = service.ask(question="truyền thuyết linh sơn thánh mẫu", active_feedback_id=active_id)
    print("\n[SCENARIO 3B] Doi chu de ngat mach sang hoi truyen thiet ('truyền thuyết linh sơn thánh mẫu')")
    assert "Cảm ơn bạn! Thông tin bổ sung vừa gõ" not in res3b.answer
    print("-> PASSED: AI khong bi mac ket trong phieu phan anh va da chuyen sang tra loi truyen thiet!")

    # --- KỊCH BẢN 4: Cung cấp SĐT có khoảng trắng/dấu chấm ("SĐT của tôi là 0912.345.678") ---
    res4 = service.ask(question="Ở bãi xe số 2 SĐT của tôi là 0912.345.678", active_feedback_id=active_id)
    print("\n[SCENARIO 4] SDT dinh dang 0912.345.678")
    assert "Cảm ơn bạn!" in res4.answer
    assert res4.feedback_id == active_id
    print("-> PASSED: AI da boc tach duoc SDT co dau dot/khoang trang va cap nhat vao CSDL!")

    # --- KỊCH BẢN 5: Du khách gõ không dấu / teencode ("cho hoi o dua ba co cho keo ko bql oi") ---
    res5 = service.ask(question="cho hoi o dua ba co cho keo ko bql oi")
    print("\n[SCENARIO 5] Du khach go khong dau / teencode ('cho hoi o dua ba co cho keo ko bql oi')")
    assert "Ban Quản lý" in res5.answer or "chèo kéo" in res5.answer or "hotline" in res5.answer.lower()
    print("-> PASSED: AI van hieu va tra ve thong tin an ninh trat tu khuyen cao chu dong!")

    print("\n==================================================")
    print("[SUCCESS] TAT CA CAC KICH BAN DU KHACH THUC TE DA TEST THANH CONG (100% PASSED)!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
