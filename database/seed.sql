-- Active: Supabase PostgreSQL
-- Mini App Zalo Trợ lý du lịch số Khu du lịch quốc gia Núi Bà Đen
-- Database Seed Data

-- 1. Insert Initial App Users (BQL, Editor, Admin)
insert into app_users (id, zalo_user_id, name, phone, avatar_url, role) values
('f8c3d359-fe2c-42da-9d19-d94dfcedb001', 'zalo_admin_01', 'Nguyễn Văn Qản', '0912345678', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'admin'),
('f8c3d359-fe2c-42da-9d19-d94dfcedb002', 'zalo_editor_01', 'Trần Thị Thuyết', '0987654321', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'editor');

-- 2. Insert Tourist Places (Danh lam, di tích)
insert into tourist_places (id, name, slug, short_description, full_description, image_url, audio_url, audio_enabled, latitude, longitude, category, status) values
(
  'e1c3d359-fe2c-42da-9d19-d94dfcedb011',
  'Chùa Bà (Linh Sơn Tiên Thạch Tự)',
  'chua-ba-linh-son-tien-thach-tu',
  'Ngôi chùa cổ hơn 300 năm tuổi, trung tâm hành hương linh thiêng nhất tại Núi Bà Đen.',
  'Linh Sơn Tiên Thạch Tự (thường gọi là Chùa Bà) nằm ở độ cao 350m giữa sườn núi Bà Đen. Ngôi chùa được khởi dựng từ thế kỷ 18, gắn liền với huyền thoại sắc phong Linh Sơn Thánh Mẫu (Bà Đen). Kiến trúc Chùa Bà pha trộn giữa nghệ thuật chùa cổ Nam Bộ và các đường nét hiện đại sau nhiều lần trùng tu. Hàng năm, hàng triệu du khách đổ về đây vào dịp Tết Nguyên Đán và Lễ hội Vía Bà (mùng 4-6 tháng 5 Âm lịch) để cầu bình an, tài lộc.',
  'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  true,
  11.378345,
  106.168924,
  'tam_linh',
  'published'
),
(
  'e1c3d359-fe2c-42da-9d19-d94dfcedb012',
  'Điện Bà (Đền thờ Linh Sơn Thánh Mẫu)',
  'dien-ba-den-tho-linh-son-thanh-mau',
  'Nơi thờ chính Linh Sơn Thánh Mẫu Bà Đen - biểu tượng tâm linh tối cao của tỉnh Tây Ninh.',
  'Điện Bà nằm ngay sát bên cạnh Chùa Bà, được xây dựng ẩn sâu vào lòng một hang đá tự nhiên. Đây là nơi thờ Linh Sơn Thánh Mẫu, vị thần bảo hộ vùng đất Tây Ninh. Không gian Điện Bà luôn nghi ngút khói hương và tràn đầy không khí trang nghiêm. Theo truyền thuyết, Linh Sơn Thánh Mẫu là nàng Lý Thị Thiên Hương trung trinh, hiển linh cứu giúp người dân trong vùng. Điện Bà được coi là huyệt đạo tâm linh linh thiêng nhất toàn bộ khu di tích.',
  'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  true,
  11.378512,
  106.169101,
  'tam_linh',
  'published'
),
(
  'e1c3d359-fe2c-42da-9d19-d94dfcedb013',
  'Tượng Phật Bà Tây Bổ Đà Sơn',
  'tuong-phat-ba-tay-bo-da-son',
  'Tượng Phật Bà bằng đồng cao nhất châu Á nằm trên đỉnh núi Bà Đen huyền thoại.',
  'Tượng Phật Bà Tây Bổ Đà Sơn tọa lạc ngự trị trên đỉnh núi Bà Đen ở độ cao 986m. Đại tượng Phật có tổng chiều cao 72m, được đúc từ hơn 170 tấn đồng đỏ theo kỹ thuật ghép các tấm đồng tinh xảo. Tượng mô tả Quán Thế Âm Bồ Tát ngự trên đài sen, tay cầm bình cam lộ. Dưới chân tượng là khu vực triển lãm Phật giáo hiện đại với công nghệ trình chiếu 3D mapping hoành tráng, mang lại trải nghiệm văn hóa tâm linh đẳng cấp quốc tế.',
  'https://images.unsplash.com/photo-1542044896530-05d85be9b11a?w=800',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  true,
  11.385423,
  106.172431,
  'tam_linh',
  'published'
),
(
  'e1c3d359-fe2c-42da-9d19-d94dfcedb014',
  'Đỉnh Núi Bà Đen (Độ cao 986m)',
  'dinh-nui-ba-den-do-cao-986m',
  'Nóc nhà Nam Bộ với mây phủ quanh năm và khuôn viên cảnh quan hoa rực rỡ.',
  'Đỉnh Núi Bà Đen với độ cao 986m là đỉnh núi cao nhất khu vực Nam Bộ, được mệnh danh là "Nóc nhà Nam Bộ". Nơi đây có khí hậu mát mẻ ôn hòa quanh năm, thường xuyên có mây mù bao phủ tạo nên cảnh tượng như chốn bồng lai tiên cảnh. Tại đỉnh núi, Ban quản lý đã kiến tạo một thiên đường hoa rộng lớn với hàng trăm loài hoa khoe sắc, cột mốc tọa độ 986m bằng đồng cổ kính và quảng trường rộng lớn để ngắm toàn cảnh hồ Dầu Tiếng yên bình.',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  true,
  11.385555,
  106.172555,
  'phong_canh',
  'published'
),
(
  'e1c3d359-fe2c-42da-9d19-d94dfcedb015',
  'Hệ thống Cáp treo Sun World BaDen Mountain',
  'he-thong-cap-treo-sun-world-baden-mountain',
  'Phương tiện di chuyển hiện đại đưa du khách lên Chùa Bà và Đỉnh Núi nhanh chóng.',
  'Hệ thống cáp treo Sun World BaDen Mountain gồm 2 tuyến cáp chính phục vụ du khách: Tuyến cáp Chùa Hang (đưa du khách từ chân núi lên khu vực Chùa Bà trong vòng 5 phút) và Tuyến cáp Vân Sơn (đưa du khách thẳng lên đỉnh Núi Bà Đen trong 8 phút). Nhà ga cáp treo Vân Sơn được tổ chức Kỷ lục Thế giới Guinness công nhận là "Nhà ga cáp treo lớn nhất thế giới" với kiến trúc mô phỏng những nét chạm khắc độc đáo và không gian đậm chất hội họa.',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  true,
  11.371234,
  106.162345,
  'dich_vu',
  'published'
);

-- 3. Insert Knowledge Articles (Kho tri thức cơ bản)
insert into knowledge_articles (id, title, content, category, visibility, source, status, updated_by) values
(
  'a1c3d359-fe2c-42da-9d19-d94dfcedb021',
  'Thông tin giá vé cáp treo Núi Bà Đen năm 2026',
  'Giá vé cáp treo Sun World BaDen Mountain được quy định rõ ràng như sau:
1. Tuyến cáp Vân Sơn (Lên đỉnh núi):
- Vé khứ hồi người lớn: 400.000 VNĐ.
- Vé khứ hồi trẻ em (1m - 1m4): 300.000 VNĐ.
- Trẻ em dưới 1m: Miễn phí hoàn toàn.

2. Tuyến cáp Chùa Hang (Lên Chùa Bà):
- Vé khứ hồi người lớn: 250.000 VNĐ.
- Vé khứ hồi trẻ em (1m - 1m4): 150.000 VNĐ.
- Vé một chiều: 150.000 VNĐ cho người lớn và 100.000 VNĐ cho trẻ em.

3. Combo Vé Đỉnh + Vé Chùa (Tất cả các tuyến):
- Người lớn: 550.000 VNĐ.
- Trẻ em (1m - 1m4): 400.000 VNĐ.

Du khách lưu ý mua vé tại quầy vé chính thức tại chân núi hoặc đặt trước qua kênh trực tuyến để tránh chèo kéo vé chợ đen.',
  've_va_gio_mo_cua',
  'public',
  'Ban Quản Lý Sun World',
  'published',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb001'
),
(
  'a1c3d359-fe2c-42da-9d19-d94dfcedb022',
  'Giờ hoạt động chi tiết của Khu du lịch Núi Bà Đen',
  'Khu du lịch Quốc gia Núi Bà Đen mở cửa phục vụ du khách tất cả các ngày trong tuần, bao gồm cả ngày Lễ, Tết. Giờ hoạt động cụ thể như sau:
1. Giờ hoạt động của Tuyến cáp treo Vân Sơn (lên đỉnh núi):
- Từ thứ Hai đến thứ Sáu: Hoạt động từ 07:00 đến 18:00 (ngừng bán vé lúc 17:00).
- Thứ Bảy và Chủ Nhật: Hoạt động từ 06:00 đến 21:00 để phục vụ du khách ngắm đèn LED đỉnh núi vào ban đêm.

2. Giờ hoạt động của Tuyến cáp treo Chùa Hang (lên Chùa Bà):
- Từ thứ Hai đến thứ Sáu: Hoạt động từ 06:00 đến 18:00.
- Thứ Bảy và Chủ Nhật: Hoạt động từ 05:30 đến 22:00.

3. Khu vực Điện thờ và Chùa Bà: Mở cửa đón khách hành hương chiêm bái từ 06:00 đến 22:00 hàng ngày.',
  've_va_gio_mo_cua',
  'public',
  'Ban Quản Lý Khu Di Tích',
  'published',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb001'
),
(
  'a1c3d359-fe2c-42da-9d19-d94dfcedb023',
  'Quy định trang phục và quy tắc ứng xử văn minh khi tham quan di tích',
  'Khi đến chiêm bái tại các cơ sở thờ tự linh thiêng tại Núi Bà Đen (Chùa Bà, Điện Bà, tượng Phật Bà), du khách bắt buộc phải tuân thủ các quy định trang phục và ứng xử sau:
1. Về trang phục:
- Trang phục lịch sự, kín đáo. Không mặc áo sát nách, áo hai dây, quần short ngắn, váy ngắn trên đầu gối khi vào chánh điện hoặc đền thờ.
- Đi giày dép lịch sự, dễ di chuyển vì có nhiều bậc tam cấp dốc.

2. Về ứng xử và an ninh trật tự:
- Giữ yên lặng, không nói cười lớn tiếng, đùa giỡn trong khu vực thờ cúng nghiêm trang.
- Không tự ý sờ vào hiện vật, tượng Phật hay vẽ bậy lên vách hang đá.
- Không xả rác bừa bãi. Hãy bỏ rác đúng nơi quy định để giữ gìn vệ sinh chung cảnh quan ngọn núi xanh.
- Không mang động vật nuôi vào khuôn viên thờ tự tôn giáo.',
  'noi_quy',
  'public',
  'Ban Quản Lý Khu Di Tích',
  'published',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb001'
),
(
  'a1c3d359-fe2c-42da-9d19-d94dfcedb024',
  'Hướng dẫn di chuyển từ TP. Hồ Chí Minh đến Núi Bà Đen',
  'Khoảng cách từ TP. Hồ Chí Minh đến Núi Bà Đen khoảng 110km. Du khách có thể lựa chọn các phương tiện sau:
1. Di chuyển bằng xe máy hoặc ô tô cá nhân:
- Tuyến đường phổ biến nhất: Đi theo Quốc lộ 22 (Xuyên Á) đến ngã ba Trảng Bàng, rẽ phải vào Tỉnh lộ 782 hoặc đi thẳng theo Quốc lộ 22 đến ngã ba Gò Dầu rồi đi theo Quốc lộ 22B để vào thành phố Tây Ninh. Từ trung tâm thành phố Tây Ninh, đi tiếp khoảng 11km theo đường Bời Lời là đến khu du lịch. Thời gian di chuyển khoảng 2,5 - 3 tiếng.

2. Di chuyển bằng Xe buýt (Bus):
- Đi xe buýt tuyến TP.HCM - Tây Ninh từ bến xe An Sương. Khi đến bến xe Tây Ninh, du khách có thể bắt tiếp xe buýt nội tỉnh hoặc taxi để di chuyển đến Núi Bà Đen.

3. Đi xe khách dịch vụ (Limousine):
- Các hãng xe chạy thẳng tuyến TP.HCM - Núi Bà Đen đón trả khách tận nơi rất thuận tiện với giá vé dao động từ 150.000 - 200.000 VNĐ/lượt.',
  'di_chuyen',
  'public',
  'Cổng thông tin du lịch Tây Ninh',
  'published',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb002'
),
(
  'a1c3d359-fe2c-42da-9d19-d94dfcedb025',
  'Lịch sử và sự tích Linh Sơn Thánh Mẫu (Bà Đen)',
  'Núi Bà Đen được biết đến không chỉ là một danh thắng tự nhiên mà còn gắn liền với tín ngưỡng thờ Linh Sơn Thánh Mẫu sâu sắc của người dân Nam Bộ.
Theo truyền thuyết phổ biến nhất, vào khoảng thế kỷ 18, có nàng Lý Thị Thiên Hương (con gái một vị quan ở Trảng Bàng) có nhan sắc xinh đẹp và tấm lòng trung trinh phụng thờ Phật pháp. Nàng đem lòng yêu thương chàng thanh niên Lê Sĩ Triệt. Khi chàng lên đường tòng quân chống giặc, nàng Thiên Hương ở nhà bị kẻ xấu vây bắt hòng cưỡng đoạt. Để giữ trọn trinh tiết, nàng đã nhảy xuống khe núi quyên sinh.
Sau đó, nàng báo mộng cho vị trụ trì chùa núi biết nơi thi thể mình và hiển linh cứu độ dân lành, xua đuổi dịch bệnh, phù hộ mùa màng tốt tươi. Cảm phục tấm lòng trinh liệt, triều đình nhà Nguyễn (vua Gia Long và sau này là vua Tự Đức) đã sắc phong nàng là "Linh Sơn Thánh Mẫu", ngự trị tại Núi Bà Đen và xây dựng đền thờ Điện Bà trang nghiêm để người dân muôn phương phụng thờ.',
  'lich_su',
  'public',
  'Sách Di Tích Lịch Sử Văn Hóa Tây Ninh',
  'published',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb002'
);

-- 4. Insert Knowledge Chunks (Văn bản phân đoạn - Mock embeddings for local / pgvector test)
-- Note: In production these embeddings will be generated via LLM API, here we insert dummy vectors of 3072 dims.
-- We can initialize them as an array of 0s, or random floats since it is just seed data.
-- We'll write the inserts for knowledge_chunks with placeholder 3072-dimensional float arrays.
-- Postgres syntax: array[0.1, 0.2, ... 3072 times] is huge, so we insert 3072-dimensional zeros.
-- Instead of generating huge arrays in SQL, we can default embedding to null or fill a simple vector.
-- The postgres vector type allows `array_fill(0.0::float, array[3072])::vector`.
insert into knowledge_chunks (id, article_id, chunk_text, embedding, metadata) values
(
  'c1c3d359-fe2c-42da-9d19-d94dfcedb031',
  'a1c3d359-fe2c-42da-9d19-d94dfcedb021',
  'Giá vé cáp treo Sun World BaDen Mountain được quy định rõ như sau: Tuyến cáp Vân Sơn (Lên đỉnh núi) khứ hồi người lớn là 400.000 VNĐ, trẻ em 1m-1m4 là 300.000 VNĐ. Trẻ em dưới 1m được miễn phí hoàn toàn.',
  array_fill(0.0::float, array[3072])::vector,
  '{"section": "Tuyến cáp Vân Sơn"}'
),
(
  'c1c3d359-fe2c-42da-9d19-d94dfcedb032',
  'a1c3d359-fe2c-42da-9d19-d94dfcedb021',
  'Tuyến cáp Chùa Hang (Lên Chùa Bà): Vé khứ hồi người lớn: 250.000 VNĐ. Vé khứ hồi trẻ em (1m - 1m4): 150.000 VNĐ. Vé một chiều: 150.000 VNĐ cho người lớn và 100.000 VNĐ cho trẻ em. Combo Vé Đỉnh + Vé Chùa: Người lớn: 550.000 VNĐ, trẻ em: 400.000 VNĐ.',
  array_fill(0.0::float, array[3072])::vector,
  '{"section": "Tuyến cáp Chùa Hang và Combo"}'
),
(
  'c1c3d359-fe2c-42da-9d19-d94dfcedb033',
  'a1c3d359-fe2c-42da-9d19-d94dfcedb022',
  'Giờ hoạt động chi tiết Tuyến cáp Vân Sơn (lên đỉnh núi): Thứ Hai đến thứ Sáu hoạt động từ 07:00 đến 18:00 (ngừng bán vé lúc 17:00). Thứ Bảy và Chủ Nhật hoạt động từ 06:00 đến 21:00 để phục vụ ngắm đèn LED đỉnh núi ban đêm.',
  array_fill(0.0::float, array[3072])::vector,
  '{"section": "Giờ cáp Vân Sơn"}'
),
(
  'c1c3d359-fe2c-42da-9d19-d94dfcedb034',
  'a1c3d359-fe2c-42da-9d19-d94dfcedb022',
  'Giờ hoạt động Tuyến cáp Chùa Hang (lên Chùa Bà): Thứ Hai đến thứ Sáu mở từ 06:00 đến 18:00. Thứ Bảy và Chủ Nhật mở từ 05:30 đến 22:00. Khu vực Điện thờ và Chùa Bà mở cửa đón khách hành hương từ 06:00 đến 22:00 hàng ngày.',
  array_fill(0.0::float, array[3072])::vector,
  '{"section": "Giờ cáp Chùa Hang & Chùa Điện"}'
),
(
  'c1c3d359-fe2c-42da-9d19-d94dfcedb035',
  'a1c3d359-fe2c-42da-9d19-d94dfcedb023',
  'Quy định trang phục khi tham quan: Mặc trang phục lịch sự, kín đáo. Không mặc áo sát nách, hai dây, quần short ngắn, váy ngắn trên đầu gối khi vào chánh điện hay đền thờ thờ tự. Giữ yên lặng, không cười đùa nói lớn tiếng, không xả rác bừa bãi và không dắt động vật nuôi vào.',
  array_fill(0.0::float, array[3072])::vector,
  '{"section": "Trang phục và hành xử"}'
);

-- 5. Insert Announcements (Thông báo từ BQL)
insert into announcements (id, title, content, type, status, published_at) values
(
  'b1c3d359-fe2c-42da-9d19-d94dfcedb041',
  'Thông báo bảo trì định kỳ tuyến cáp treo Vân Sơn ngày 25/05/2026',
  'Ban quản lý Sun World BaDen Mountain trân trọng thông báo đến Quý du khách: Tuyến cáp treo Vân Sơn (đưa khách lên đỉnh núi) sẽ tạm ngưng hoạt động trong ngày thứ Hai 25/05/2026 để tiến hành công tác bảo trì kỹ thuật định kỳ định kỳ. Tuyến cáp treo Chùa Hang vẫn hoạt động bình thường để đưa đón khách lên chiêm bái Chùa Bà. Tuyến cáp Vân Sơn sẽ hoạt động trở lại bình thường vào lúc 07:00 ngày 26/05/2026. Ban quản lý thành thật xin lỗi vì sự bất tiện này.',
  'emergency',
  'published',
  now() - interval '1 day'
),
(
  'b1c3d359-fe2c-42da-9d19-d94dfcedb042',
  'Khai mạc Lễ hội Vía Bà Linh Sơn Thánh Mẫu năm 2026',
  'Lễ hội Vía Bà Linh Sơn Thánh Mẫu - Di sản văn hóa phi vật thể quốc gia sẽ chính thức khai mạc từ ngày mùng 4 đến mùng 6 tháng 5 Âm lịch (tức ngày 18/06 đến 20/06/2026 Dương lịch) tại Khu di tích Núi Bà Đen. Lễ hội bao gồm các nghi lễ cổ truyền tôn nghiêm như lễ tắm bia Bà, lễ hưng tác, trình thập hiến và các chương trình biểu diễn nghệ thuật dân gian độc đáo Khmer, đờn ca tài tử. Kính mời du khách gần xa về tham dự chiêm bái và cầu may.',
  'festival',
  'published',
  now()
),
(
  'b1c3d359-fe2c-42da-9d19-d94dfcedb043',
  'Khuyến cáo an toàn phòng tránh giông sét ban chiều trên đỉnh núi',
  'Theo dự báo từ Đài Khí tượng Thủy văn, khu vực Núi Bà Đen trong tuần này thường xuất hiện mưa rào và giông kèm sấm sét vào các buổi chiều muộn (khoảng sau 15:30). Ban Quản lý khuyến cáo du khách tham quan đỉnh núi chú ý đề phòng: Khi có giông sét, tuyệt đối tuân thủ chỉ dẫn của nhân viên điều phối, nhanh chóng di chuyển vào trong các nhà ga cáp treo hoặc khu triển lãm có hệ thống chống sét an toàn. Tránh đứng gần các cây cao, khu vực quảng trường trống trải ngoài trời.',
  'weather',
  'published',
  now() + interval '1 hour'
);

-- 6. Insert Feedback Reports (Phản ánh kiến nghị từ du khách)
insert into feedback_reports (id, reporter_name, phone, report_type, content, image_url, latitude, longitude, status, assigned_unit, internal_note) values
(
  'd1c3d359-fe2c-42da-9d19-d94dfcedb051',
  'Lê Hoàng Nam',
  '0909887766',
  've_sinh',
  'Tại khu vực nhà vệ sinh công cộng gần Chùa Bà bị đọng nước gây trơn trượt nguy hiểm và có mùi hôi chưa được dọn dẹp sạch sẽ kịp thời lúc trưa đông khách.',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
  11.378401,
  106.168855,
  'new',
  'Đội Vệ Sinh Môi Trường',
  'Cần phân công nhân sự trực liên tục vào các khung giờ cao điểm 11h-13h.'
),
(
  'd1c3d359-fe2c-42da-9d19-d94dfcedb052',
  'Phạm Minh Tuấn',
  '0911223344',
  'cheo_keo',
  'Xuất hiện tình trạng một nhóm người chèo kéo du khách mua vé số, bán nhang đèn ngay khi du khách vừa bước xuống bãi đỗ xe ô tô số 2 gây phiền hà.',
  null,
  11.370500,
  106.161000,
  'in_progress',
  'Đội Trật Tự Khu Di Tích',
  'Đã cử lực lượng bảo vệ tăng cường tuần tra tại khu vực bãi đỗ xe số 2 để nhắc nhở và giải tán.'
);

-- 7. Insert Chat Logs
insert into chat_logs (id, user_id, channel, question, answer, source_article_ids, confidence_score) values
(
  '91c3d359-fe2c-42da-9d19-d94dfcedb061',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb001',
  'mini_app',
  'Giá vé cáp treo lên đỉnh núi là bao nhiêu vậy?',
  'Giá vé cáp treo Sun World BaDen Mountain tuyến cáp Vân Sơn lên đỉnh núi như sau: Vé khứ hồi người lớn là 400.000 VNĐ; vé khứ hồi trẻ em (từ 1m đến 1m4) là 300.000 VNĐ; trẻ em dưới 1m được miễn phí hoàn toàn.',
  '["a1c3d359-fe2c-42da-9d19-d94dfcedb021"]'::jsonb,
  0.985
),
(
  '91c3d359-fe2c-42da-9d19-d94dfcedb062',
  'f8c3d359-fe2c-42da-9d19-d94dfcedb001',
  'mini_app',
  'Chùa Bà Đen mở cửa từ mấy giờ đến mấy giờ?',
  'Khu vực Điện thờ và Chùa Bà mở cửa chiêm bái từ 06:00 đến 22:00 hàng ngày. Riêng tuyến cáp treo Chùa Hang lên Chùa Bà hoạt động từ 06:00 đến 18:00 (ngày thường) và mở sớm hơn từ 05:30 đến 22:00 vào thứ Bảy và Chủ Nhật.',
  '["a1c3d359-fe2c-42da-9d19-d94dfcedb022"]'::jsonb,
  0.950
);
