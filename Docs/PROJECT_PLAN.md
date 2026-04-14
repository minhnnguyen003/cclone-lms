# CClone LMS — Kế Hoạch Dự Án

## Bối Cảnh

Xây dựng một hệ thống quản lý học tập (LMS) lấy dữ liệu làm trung tâm, lấy cảm hứng từ Canvas LMS. Dự án chia thành ba giai đoạn: MVP, Củng cố, và Theo dõi/Phân tích. Mục tiêu không phải sao chép Canvas, mà xây dựng một LMS tập trung với lợi thế về phân tích dữ liệu.

---

## Tổng Quan Kiến Trúc

```
                    +------------------+
                    |   Frontend (SPA) |
                    |   React + Vite   |
                    +--------+---------+
                             |
                        REST API
                             |
                    +--------+---------+
                    |  Backend (NestJS) |
                    |  Node.js + TS     |
                    +--------+---------+
                             |
            +----------------+----------------+
            |                |                |
      +-----+-----+   +-----+-----+   +------+------+
      | PostgreSQL |   |   Redis   |   |    MinIO    |
      | (chính)    |   |  (cache)  |   | (file/S3)   |
      +------------+   +-----------+   +-------------+
```

**Công nghệ sử dụng:**
- Backend: NestJS (TypeScript)
- Frontend: React + Vite + TailwindCSS
- Cơ sở dữ liệu: PostgreSQL
- Cache: Redis
- Lưu trữ file: MinIO (tương thích S3)
- Xác thực: JWT + Refresh Token
- Container hóa: Docker Compose

---

## Giai Đoạn 1 — MVP (Làm Cho Chạy Được)

**Mục tiêu:** Hệ thống hoạt động được end-to-end với vòng lặp LMS cốt lõi: tạo khóa học, ghi danh, nộp bài, chấm điểm.

### 1.1 Khởi Tạo Dự Án
- Khởi tạo backend NestJS với TypeScript
- Khởi tạo frontend React với Vite
- Docker Compose cho PostgreSQL, Redis, MinIO
- Cấu hình môi trường (.env)
- Thiết lập migration cơ sở dữ liệu (TypeORM hoặc Prisma)

### 1.2 Xác Thực và Người Dùng
- Đăng ký và đăng nhập (email + mật khẩu)
- JWT access token + refresh token
- Ba vai trò: `Student`, `Instructor`, `Admin`
- Phân quyền cơ bản theo vai trò (RBAC middleware)
- Trang cá nhân người dùng (xem/sửa)

### 1.3 Quản Lý Khóa Học
- CRUD khóa học (chỉ Instructor/Admin)
- Trang danh sách và chi tiết khóa học
- Ghi danh: Instructor mời hoặc Student yêu cầu
- Dashboard khóa học hiển thị người dùng và nội dung

### 1.4 Bài Tập và Nộp Bài
- Instructor tạo bài tập (tiêu đề, mô tả, hạn nộp, file đính kèm)
- Student nộp bài (văn bản + upload file)
- Instructor xem bài nộp, chấm điểm và góp ý
- Theo dõi trạng thái bài nộp: `nháp`, `đã nộp`, `đã chấm`

### 1.5 Giao Diện Cơ Bản
- Trang đăng nhập / đăng ký
- Danh sách khóa học và chi tiết khóa học
- Danh sách bài tập và form nộp bài
- Giao diện chấm điểm cho instructor
- Bố cục responsive với TailwindCSS

### 1.6 Mô Hình Dữ Liệu Cốt Lõi

```
User (id, email, password_hash, name, role, created_at)
Course (id, title, description, instructor_id, created_at)
Enrollment (id, user_id, course_id, role, enrolled_at)
Assignment (id, course_id, title, description, due_date, created_at)
Submission (id, assignment_id, student_id, content, file_url, status, grade, feedback, submitted_at)
```

**Sản phẩm:** Một phiên bản mini Google Classroom hoạt động được — người dùng đăng ký, tham gia khóa học, nộp bài, và nhận điểm.

---

## Giai Đoạn 2 — Củng Cố (Sản Phẩm Thực Sự)

**Mục tiêu:** Phân quyền chi tiết, quản lý nội dung, thông báo, và hệ thống bài kiểm tra. Đây là lúc hệ thống không còn là prototype.

### 2.1 Hệ Thống Phân Quyền (Quan Trọng Nhất)
- RBAC chi tiết vượt ra ngoài role guard đơn giản:
  - Instructor chỉ thấy khóa học của mình
  - Student chỉ thấy khóa học đã ghi danh
  - Admin có toàn quyền
- Phân quyền cấp tài nguyên (kiểm tra quyền sở hữu trên mọi thao tác ghi)
- Pattern middleware/decorator cho phân quyền sạch
- Chống leo thang quyền ngang (horizontal privilege escalation)

### 2.2 Hệ Thống Thông Báo
- Kiến trúc hướng sự kiện sử dụng BullMQ (job queue trên Redis)
- Loại thông báo: nhắc hạn nộp, bài đã nộp, điểm đã công bố
- Kênh gửi: thông báo trong app, email (tích hợp SMTP)
- Tùy chọn thông báo theo người dùng

### 2.3 Quản Lý File và Nội Dung
- Dịch vụ upload file trừu tượng hóa trên MinIO/S3
- Hỗ trợ PDF, hình ảnh, tham chiếu video
- Giới hạn kích thước và kiểm tra loại file
- Tổ chức nội dung theo khóa học (tài liệu, đính kèm)
- Signed URL cho truy cập file an toàn

### 2.4 Hệ Thống Bài Kiểm Tra
- Loại câu hỏi: trắc nghiệm, đúng/sai, trả lời ngắn, tự luận
- Cấu hình bài kiểm tra: giới hạn thời gian, số lần làm, xáo trộn câu hỏi
- Vòng đời bài làm: `bắt đầu` -> `đang làm` -> `đã nộp` -> `đã chấm`
- Tự động chấm điểm cho câu hỏi khách quan (trắc nghiệm, đúng/sai)
- Hàng đợi chấm điểm thủ công cho tự luận
- Xử lý trường hợp đặc biệt: đóng trình duyệt, hết giờ, mất mạng (tự động lưu tiến trình)

### 2.5 Nhật Ký Kiểm Tra (Audit Log)
- Ghi lại mọi hành động quan trọng: đăng nhập, thay đổi điểm, nộp bài, thay đổi ghi danh
- Schema: `(id, user_id, action, resource_type, resource_id, metadata, timestamp)`
- Admin xem được toàn bộ lịch sử thao tác

### 2.6 Diễn Đàn Thảo Luận
- Chủ đề thảo luận theo khóa học
- Trả lời và bình luận lồng nhau
- Instructor có thể ghim hoặc đóng chủ đề

**Sản phẩm:** Hệ thống xử lý phân quyền đúng, hỗ trợ bài kiểm tra, và hoạt động như sản phẩm thực dưới điều kiện sử dụng bình thường.

---

## Giai Đoạn 3 — Theo Dõi và Phân Tích (Lợi Thế Cạnh Tranh)

**Mục tiêu:** Biến LMS thành nền tảng dữ liệu với phân tích thời gian thực, dashboard KPI, và tự động hóa.

### 3.1 Hạ Tầng Theo Dõi Sự Kiện
- Phát sự kiện cho mọi hành động người dùng:
  - `user.login`, `course.viewed`, `assignment.submitted`, `quiz.completed`
- Schema sự kiện: `(event_type, user_id, resource_id, metadata, timestamp)`
- Event bus sử dụng Kafka (hoặc BullMQ cho quy mô nhỏ)
- Event consumer lưu vào kho phân tích

### 3.2 Cơ Sở Dữ Liệu Phân Tích
- ClickHouse (hoặc TimescaleDB) làm kho phân tích
- Materialized view cho các phép tổng hợp thường dùng:
  - Hoạt động sinh viên theo ngày/tuần
  - Tỷ lệ hoàn thành khóa học
  - Điểm trung bình theo bài tập
  - Phân bố kết quả bài kiểm tra

### 3.3 Dashboard và Báo Cáo
- **Dashboard Instructor:** chỉ số theo khóa học — tỷ lệ nộp bài, phân bố điểm, mức tương tác sinh viên
- **Dashboard Admin:** KPI toàn hệ thống — người dùng hoạt động, xu hướng tạo khóa học, mức sử dụng hệ thống
- **Dashboard Student:** tiến độ cá nhân — điểm theo thời gian, chuỗi hoạt động, hạn nộp sắp tới
- Thư viện biểu đồ: Recharts hoặc Chart.js trên frontend

### 3.4 Tự Động Hóa và Rule Engine
- Định nghĩa rule đơn giản (dạng JSON):
  - NẾU sinh viên không hoạt động > 7 ngày THÌ gửi email nhắc nhở
  - NẾU bài tập quá hạn THÌ đánh dấu `trễ`
  - NẾU điểm kiểm tra < 50% THÌ đề xuất tài liệu ôn tập
- Cron chạy đánh giá rule định kỳ
- Loại hành động: gửi thông báo, cập nhật trạng thái, gọi webhook

### 3.5 Xuất Dữ Liệu và API
- Xuất CSV/PDF cho báo cáo điểm
- API công khai với xác thực API key cho tích hợp bên ngoài
- Hệ thống webhook cho thông báo công cụ bên ngoài

**Sản phẩm:** Một LMS lấy dữ liệu làm trung tâm, nơi instructor và admin ra quyết định dựa trên số liệu thực, và hệ thống tự động hóa các tác vụ thường ngày.

---

## Kế Hoạch Kiểm Chứng

1. **Giai đoạn 1:** Kiểm tra thủ công end-to-end — đăng ký hai người dùng (instructor + student), tạo khóa học, ghi danh, nộp bài, chấm điểm
2. **Giai đoạn 2:** Kiểm tra ranh giới phân quyền — xác nhận student không truy cập được khóa học khác, timer bài kiểm tra hoạt động đúng, thông báo gửi đúng
3. **Giai đoạn 3:** Tạo dữ liệu hoạt động giả lập, kiểm tra dashboard hiển thị đúng phép tổng hợp, kích hoạt rule và xác nhận hành động thực thi

---

## Cấu Trúc Thư Mục Khởi Tạo

```
/backend          — Ứng dụng NestJS
/frontend         — Ứng dụng React + Vite
/docker           — Docker Compose + cấu hình dịch vụ
/docs             — Đặc tả API, ERD, kế hoạch dự án
docker-compose.yml
.gitignore
README.md
```

---

## Đánh Giá Độ Khó

| Thành phần              | Độ khó     |
| ----------------------- | ---------- |
| CRUD + Khóa học         | Dễ         |
| Bài tập và nộp bài      | Trung bình |
| Hệ thống phân quyền    | Khó        |
| Hệ thống bài kiểm tra  | Rất khó    |
| Pipeline phân tích      | Rất khó    |
| Mở rộng quy mô         | Rất khó    |
