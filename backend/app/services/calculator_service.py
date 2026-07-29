"""
Calculator Service — CrawBot RAG
Parses numbers of adults and children from user questions and pre-calculates ticket & combo totals.
Guarantees 100% mathematical accuracy for pricing inquiries.
"""
import re
from typing import Dict, Any, Optional

class CalculatorService:
    def __init__(self):
        # Official 2026 Ticket Rates
        self.RATES = {
            "combo_2_lines": {
                "name": "Combo 2 tuyến cáp (Vé Đỉnh Vân Sơn + Vé Chùa Hang + Buffet trưa)",
                "weekday": {"adult": 800000, "child": 600000},
                "weekend": {"adult": 850000, "child": 650000},
            },
            "combo_1_line": {
                "name": "Combo 1 tuyến cáp (Vé Đỉnh Vân Sơn + Buffet trưa)",
                "weekday": {"adult": 650000, "child": 450000},
                "weekend": {"adult": 700000, "child": 500000},
            },
            "van_son_peak": {
                "name": "Vé khứ hồi Tuyến Đỉnh Vân Sơn",
                "weekday": {"adult": 450000, "child": 350000},
                "weekend": {"adult": 450000, "child": 350000},
            },
            "chua_hang": {
                "name": "Vé khứ hồi Tuyến Chùa Hang",
                "weekday": {"adult": 250000, "child": 150000},
                "weekend": {"adult": 250000, "child": 150000},
            },
            "sunset_combo_2_lines": {
                "name": "Combo Hoàng Hôn 986m 2 tuyến cáp (Sau 17h + Tiệc tối)",
                "weekday": {"adult": 500000, "child": 400000},
                "weekend": {"adult": 500000, "child": 400000},
            },
            "sunset_combo_1_line": {
                "name": "Combo Hoàng Hôn 986m 1 tuyến cáp (Sau 17h + Tiệc tối)",
                "weekday": {"adult": 400000, "child": 300000},
                "weekend": {"adult": 400000, "child": 300000},
            }
        }

    def parse_quantities(self, question: str) -> Dict[str, int]:
        """Extract number of adults and children from Vietnamese/English text."""
        q = question.lower()
        adults = 0
        children = 0

        # Adults regex patterns (e.g. 2 người lớn, hai người lớn, 2 ng lớn, 2 adults)
        adult_patterns = [
            r'(\d+)\s*(?:người lớn|ng lớn|nguoi lon|adult|khách lớn)',
            r'(hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\s*(?:người lớn|ng lớn|nguoi lon|adult)'
        ]
        num_word_map = {"một": 1, "hai": 2, "ba": 3, "bốn": 4, "năm": 5, "sáu": 6, "bảy": 7, "tám": 8, "chín": 9, "mười": 10}

        for pat in adult_patterns:
            m = re.search(pat, q)
            if m:
                val = m.group(1)
                adults = int(val) if val.isdigit() else num_word_map.get(val, 0)
                break

        # Children regex patterns (e.g. 1 trẻ em, 2 bé, 1 em bé, 1 child, 2 children)
        child_patterns = [
            r'(\d+)\s*(?:trẻ em|tre em|bé|em bé|child|children|trẻ)',
            r'(một|hai|ba|bốn|năm)\s*(?:trẻ em|tre em|bé|em bé|child|children)'
        ]
        for pat in child_patterns:
            m = re.search(pat, q)
            if m:
                val = m.group(1)
                children = int(val) if val.isdigit() else num_word_map.get(val, 0)
                break

        return {"adults": adults, "children": children}

    def calculate_totals(self, question: str) -> Optional[str]:
        """Generate formatted calculation breakdown string if quantities and combo ticket intent match."""
        counts = self.parse_quantities(question)
        adults = counts["adults"]
        children = counts["children"]

        if adults == 0 and children == 0:
            return None

        q = question.lower()
        is_weekend = any(w in q for w in ["cuối tuần", "cuoi tuan", "thứ 7", "thứ bảy", "chủ nhật", "t7", "cn", "saturday", "sunday", "weekend"])
        period_key = "weekend" if is_weekend else "weekday"
        period_label = "Cuối tuần (Thứ 7, Chủ Nhật)" if is_weekend else "Ngày thường (Thứ 2 - Thứ 6)"

        results = []
        results.append(f"[TÍNH TOÁN BẢNG GIÁ CHI TIẾT TỰ ĐỘNG - ÁP DỤNG: {period_label.upper()}]")
        results.append(f"- Số lượng khách: {adults} người lớn, {children} trẻ em (1m - 1m4). (Trẻ em dưới 1m miễn phí)")

        # 1. Combo 2 tuyến
        r2 = self.RATES["combo_2_lines"][period_key]
        tot2_adult = adults * r2["adult"]
        tot2_child = children * r2["child"]
        tot2_sum = tot2_adult + tot2_child
        results.append(
            f"\n1. {self.RATES['combo_2_lines']['name']}:\n"
            f"   + Người lớn: {r2['adult']:,} VNĐ x {adults} = {tot2_adult:,} VNĐ\n"
            f"   + Trẻ em: {r2['child']:,} VNĐ x {children} = {tot2_child:,} VNĐ\n"
            f"   => TỔNG CỘNG COMBO 2 TUYẾN: {tot2_sum:,} VNĐ"
        )

        # 2. Combo 1 tuyến
        r1 = self.RATES["combo_1_line"][period_key]
        tot1_adult = adults * r1["adult"]
        tot1_child = children * r1["child"]
        tot1_sum = tot1_adult + tot1_child
        results.append(
            f"\n2. {self.RATES['combo_1_line']['name']}:\n"
            f"   + Người lớn: {r1['adult']:,} VNĐ x {adults} = {tot1_adult:,} VNĐ\n"
            f"   + Trẻ em: {r1['child']:,} VNĐ x {children} = {tot1_child:,} VNĐ\n"
            f"   => TỔNG CỘNG COMBO 1 TUYẾN: {tot1_sum:,} VNĐ"
        )

        results.append("\nHƯỚNG DẪN LLM: Sử dụng chính xác các con số tính toán tự động ở trên để trả lời du khách. Không tự tính lại để tránh sai sót.")

        return "\n".join(results)

calculator_service = CalculatorService()
