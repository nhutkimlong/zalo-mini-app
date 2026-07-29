import os
import uuid
import re

output_dir = r'D:\AICoworker\06-chuyen-doi-so\chatbot-knowledge'

articles = {
    'di-tich-chua-hang-linh-son-long-chau-tu': {
        'title': 'Chùa Hang (Linh Sơn Long Châu Tự)',
        'category': 'di_tich',
        'content': '''# Chùa Hang (Linh Sơn Long Châu Tự)

**Linh Sơn Long Châu Tự** (thường gọi dân gian là **Chùa Hang**) là một trong những tự viện cổ kính nằm ở độ cao trung bình trên sườn núi Bà Đen. Chùa gắn liền với hệ thống hang động tự nhiên hiểm trở, mang đậm giá trị tâm linh Phật giáo và truyền thống đấu tranh cách mạng.

- **Vị trí:** Nằm ở phía bên trái Điện Bà trên sườn núi Bà Đen. Từ Điện Bà đi qua khu vực đá nứt làm đôi để sang Chùa Hang.
- **Lịch sử hình thành:** Tiền thân là Hang Ông Chàm. Đầu thế kỷ XX, Sư Trừng Tâm Huệ Mạng đã khai sơn lập tự, cải tạo hang đá hoang vu thành nơi tu tập. 
- **Giá trị lịch sử:** Trong kháng chiến chống Pháp, Chùa Hang từng là cơ sở cách mạng quan trọng. Năm 1946, chùa từng bị quân Pháp thiêu rụi và sau này được phục dựng lại.
- **Trụ trì hiện tại:** Sư cô Thích Nữ Diệu Minh.
'''
    },
    'di-tich-chua-hoa-dong-linh-son-hoa-dong-tu': {
        'title': 'Chùa Hòa Đồng (Linh Sơn Hòa Đồng Tự)',
        'category': 'di_tich',
        'content': '''# Chùa Hòa Đồng (Linh Sơn Hòa Đồng Tự)

**Linh Sơn Hòa Đồng Tự** (thường gọi là **Chùa Hòa Đồng**) là một ngôi chùa cổ kính tọa lạc trên sườn núi Bà Đen, nổi tiếng với cảnh trí thanh tịnh, ẩn mình bên các vách đá tự nhiên.

- **Vị trí:** Nằm ở phía bên phải Điện Bà trên sườn núi Bà Đen, ngay sát bên cạnh là động Thanh Long.
- **Lịch sử:** Chùa gắn liền với đạo nghiệp thời trẻ của Hòa thượng Thích Giác Điền (thập niên 1910 - 1920), người đã trực tiếp khai phá động Thanh Long kế bên để trồng cây và tu khổ hạnh.
- **Giá trị cách mạng:** Trong kháng chiến chống Pháp, đây là cơ sở hậu cần đắc lực cho lực lượng quân báo cách mạng.
'''
    },
    'cac-ngoi-chua-va-tinh-xa-khac-tai-nui-ba-den': {
        'title': 'Các tự viện và tịnh xá khác tại Núi Bà Đen',
        'category': 'di_tich',
        'content': '''# Các tự viện và tịnh xá khác tại Núi Bà Đen

Ngoài các hệ thống chùa chính yếu như Điện Bà, Chùa Hang, Chùa Hòa Đồng... Quần thể danh thắng Núi Bà Đen còn có các cơ sở tôn giáo khác nằm trong khuôn viên Khu du lịch:

1. **Chùa Long Châu (Long Châu Phước Trung Tự):** Nằm trong khu du lịch quốc gia, hiện do Sư cô Thích Nữ Diệu Đức làm Trụ trì.
2. **Chùa Quan Âm (Quan Âm Tự):** Một ngôi tự viện thanh tịnh trên núi, do Sư cô Thích Nữ Diệu Mẫn làm Trụ trì.
3. **Tịnh xá Ngọc Truyền:** Cơ sở tu tập khang trang, do Ni trưởng Thích Nữ Phụng Liên quản lý.
'''
    },
    'di-tich-can-cu-dong-kim-quang': {
        'title': 'Căn cứ kháng chiến Động Kim Quang',
        'category': 'di_tich',
        'content': '''# Căn cứ kháng chiến Động Kim Quang

**Động Kim Quang** là một di tích lịch sử cách mạng cấp Quốc gia, từng là Căn cứ Huyện ủy, Huyện đội Tòa Thánh trong giai đoạn 1961 - 1975. Nơi đây là biểu tượng huyền thoại của tinh thần bám núi kiên cường chiến đấu.

- **Vị trí:** Sườn nam núi Bà Đen, độ cao 50m (phường Bình Minh, tỉnh Tây Ninh).
- **Lịch sử:** Ban đầu do sư thầy Kim Quang tu tập, đến năm 1961 nhường lại cho cách mạng làm căn cứ. Nơi đây từng đóng vai trò chốt tiền tiêu, với các "dũng sĩ núi Bà" bắn tỉa làm địch khiếp sợ. Căn cứ từng chịu sự càn quét khốc liệt bởi pháo hạng nặng, bom napalm và chất độc hóa học nhưng vẫn đứng vững.
- **Lễ hội truyền thống:** Diễn ra vào ngày 14 tháng Giêng âm lịch hằng năm để tưởng nhớ các anh hùng liệt sĩ đã hy sinh tại căn cứ.
'''
    },
    'di-tich-can-cu-lien-doi-7': {
        'title': 'Căn cứ Liên Đội 7',
        'category': 'di_tich',
        'content': '''# Căn cứ Liên Đội 7

**Liên Đội 7** là Đơn vị Anh hùng Lực lượng Vũ trang Nhân dân, bám trụ núi Bà Đen chiến đấu kiên cường từ năm 1962 đến 1975.

- **Vị trí:** Phía Bắc núi Bà Đen (sườn núi Phụng), phường Bình Minh.
- **Thành lập:** Tiền thân là Tổ trinh sát mật đất A14 trực thuộc Phòng 2 Bộ Tham mưu Miền (gồm 14 chiến sĩ). Đến năm 1964 mở rộng thành Liên đội 7.
- **Đời sống cách mạng:** Quân đội ta đã bám trụ trong các hang đá hiểm trở, tự gùi đất lên đá để trồng rau (xà lách xoong, rau muống), bắt ốc núi, kỳ đà để sinh tồn trong điều kiện bị cô lập và chất độc hóa học.
- **Chiến công:** Tiêu diệt gần 2.000 tên địch, bắn rơi 8 trực thăng, phá hủy 23 xe tăng. Nổi bật là trận đánh bại Lữ đoàn 196 của Mỹ vào tháng 02/1970.
'''
    },
    'di-tich-can-cu-suoi-mon': {
        'title': 'Căn cứ Suối Môn',
        'category': 'di_tich',
        'content': '''# Căn cứ Suối Môn

**Căn cứ Suối Môn** là Di tích lịch sử Quốc gia, từng là căn cứ kháng chiến của Đảng bộ và nhân dân xã Phan bám trụ chiến đấu oanh liệt trong giai đoạn 1964 - 1975.

- **Vị trí:** Sườn đông nam núi Bà Đen, cách chân núi chỉ khoảng 200m.
- **Lịch sử:** Được thành lập năm 1964 để chống lại âm mưu càn quét gom dân vào ấp chiến lược của địch. Căn cứ có nhiệm vụ bám dân, xây dựng cơ sở mật, và là trạm trung chuyển thương bệnh binh quan trọng.
- **Địa hình:** Dựa vào 2 con suối sâu làm chướng ngại vật cùng hệ thống hang động tự nhiên dễ trú ẩn.
'''
    },
    'le-hoi-xuan-nui-ba-den': {
        'title': 'Hội Xuân Núi Bà Đen',
        'category': 'le_hoi',
        'content': '''# Hội Xuân Núi Bà Đen

**Hội Xuân Núi Bà Đen** là một trong những lễ hội đầu năm lớn nhất tại Nam Bộ, thu hút hàng triệu du khách và Phật tử thập phương về trẩy hội, chiêm bái.

- **Thời gian diễn ra:** Xuyên suốt trong tháng Giêng âm lịch hằng năm.
- **Hoạt động chính:** Du khách đến tham dự Hội Xuân thường dâng hương cầu bình an, may mắn tại hệ thống các chùa núi Bà (Đặc biệt là Điện Bà). Bên cạnh đó, Khu du lịch còn tổ chức nhiều chương trình biểu diễn văn hóa nghệ thuật đặc sắc, múa lân sư rồng và các trò chơi dân gian rộn ràng mang đậm không khí Tết cổ truyền.
'''
    }
}

for slug, data in articles.items():
    filepath = os.path.join(output_dir, f"{slug}.md")
    
    # Generate new UUID for the article
    doc_id = str(uuid.uuid4())
    
    # Create frontmatter
    props = [
        '---',
        f'id: "{doc_id}"',
        f'title: "{data["title"]}"',
        f'category: "{data["category"]}"',
        'status: "published"',
        'source: "Ban Quản lý KDLQG Núi Bà Đen"',
        'sync: true',
        '---\n\n'
    ]
    
    final_content = "\n".join(props) + data['content']
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f"Created: {slug}.md")

print("All new articles generated successfully.")
