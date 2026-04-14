# CClone LMS — Danh Sách Tính Năng

---

## Giai Đoạn 1: MVP (Tính năng cơ bản)

### Xác Thực và Người Dùng
- Đăng ký tài khoản (email + mật khẩu)
- Đăng nhập với JWT + refresh token
- Phân quyền theo vai trò: Student, Instructor, Admin
- Xem và chỉnh sửa trang cá nhân

### Quản Lý Khóa Học
- Tạo, sửa, xóa khóa học (Admin)
- Danh sách khóa học có tìm kiếm
- Trang chi tiết khóa học
- Ghi danh sinh viên (mời hoặc yêu cầu)
- Dashboard khóa học với danh sách người dùng

### Bài Tập và Nộp Bài
- Tạo bài tập với tiêu đề, mô tả, hạn nộp, file đính kèm
- Sinh viên nộp bài (văn bản và/hoặc file)
- Theo dõi trạng thái bài nộp: nháp, đã nộp, đã chấm
- Instructor chấm điểm với điểm số và nhận xét
- Danh sách bài tập theo khóa học

### Giao Diện
- Trang đăng nhập và đăng ký
- Trang danh sách và chi tiết khóa học
- Giao diện nộp bài
- Giao diện chấm điểm cho instructor
~~- Giao diện responsive~~
~~- Giao diện kết nối với hệ thống chống đạo văn~~

---

## Giai Đoạn 2: Hardening

### Hệ Thống Phân Quyền
- Phân quyền cấp tài nguyên (kiểm tra quyền sở hữu)
- Instructor chỉ thấy khóa học của mình
- Student chỉ thấy khóa học đã ghi danh
- Admin có toàn quyền
- Chống leo thang quyền ngang

### Hệ Thống Thông Báo
- Trung tâm thông báo trong ứng dụng
~~- Thông báo qua email (SMTP)~~
- Loại thông báo: nhắc hạn nộp, bài đã nộp, điểm đã công bố
- Tùy chọn thông báo theo người dùng

### Quản Lý File và Nội Dung
- Dịch vụ upload file trừu tượng hóa trên S3/MinIO
- Hỗ trợ PDF, hình ảnh, video
- Kiểm tra kích thước và loại file
- Signed URL để truy cập an toàn
- Phần tài liệu khóa học (tổ chức theo khóa học)

### Hệ Thống Bài Kiểm Tra
- Loại câu hỏi: trắc nghiệm, đúng/sai, trả lời ngắn, tự luận
- Tạo bài kiểm tra với giới hạn thời gian, số lần làm, xáo trộn câu hỏi
- Vòng đời bài làm: bắt đầu, đang làm, đã nộp, đã chấm
- Tự động chấm điểm câu hỏi khách quan
- Hàng đợi chấm điểm thủ công cho tự luận
- Tự động lưu tiến trình (xử lý đóng trình duyệt, hết giờ, mất mạng)

### Nhật Ký Kiểm Tra (Audit Log)
- Ghi lại mọi hành động quan trọng của người dùng
- Trường: người dùng, hành động, loại tài nguyên, ID tài nguyên, metadata, thời gian
- Admin xem được toàn bộ lịch sử

### Diễn Đàn Thảo Luận
- Chủ đề thảo luận theo khóa học
- Trả lời và bình luận lồng nhau
- Ghim và đóng chủ đề (Instructor)

---

## Giai Đoạn 3: Theo Dõi và Phân Tích

### Theo Dõi Sự Kiện
- Sự kiện cho mọi hành động người dùng (đăng nhập, xem, nộp, hoàn thành, alt tab trong quá trình làm bài (cho việc thi/kiểm tra))
- Schema sự kiện: loại, user ID, resource ID, metadata, thời gian
- Event bus (Kafka hoặc BullMQ)
- Consumer lưu vào kho phân tích

### Cơ Sở Dữ Liệu Phân Tích
- ClickHouse làm kho phân tích
- Materialized view cho các phép tổng hợp thường dùng
- Hoạt động sinh viên theo ngày/tuần
- Tỷ lệ hoàn thành khóa học
- Điểm trung bình theo bài tập
- Phân bố kết quả bài kiểm tra

~~### Dashboard~~
~~- Dashboard Instructor: tỷ lệ nộp bài, phân bố điểm, mức tương tác theo khóa học~~
~~- Dashboard Admin: người dùng hoạt động, xu hướng tạo khóa học, KPI toàn hệ thống~~
~~- Dashboard Student: điểm cá nhân theo thời gian, chuỗi hoạt động, hạn nộp sắp tới~~

### Tự Động Hóa và Rule Engine
- Định nghĩa rule bằng JSON
- Điều kiện: sinh viên không hoạt động N ngày, trừ điểm bài tập quá hạn, điểm kiểm tra dưới ngưỡng
- Hành động: gửi thông báo, cập nhật trạng thái, gọi webhook
~~- Cron chạy đánh giá rule định kỳ~~

~~### Xuất Dữ Liệu và API~~
~~- Xuất CSV và PDF cho báo cáo điểm~~
~~- API công khai với xác thực API key~~
~~- Hệ thống webhook cho tích hợp công cụ bên ngoài~~
