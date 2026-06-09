# TÀI LIỆU THIẾT KẾ HỆ THỐNG (SYSTEM DESIGN DOCUMENT)

## 1. Giới thiệu tổng quan (Executive Summary)
**Tên ứng dụng:** AutoJob Pro - Trợ lý Tìm kiếm & Ứng tuyển Tự động cho Chuyên gia Tự động hóa  
**Đối tượng mục tiêu:** Kỹ sư Trưởng / Quản lý Dự án / Giám đốc Kỹ thuật & Sản xuất (Target: **Võ Diệp Quốc Tuấn**)  
**Mục tiêu hệ thống:** 
* Tự động hóa quá trình quét tin tuyển dụng từ các nền tảng lớn thiết thực nhất tại Việt Nam (**VietnamWorks, TopCV, LinkedIn**).
* Đánh giá mức độ tương thích công việc sâu sắc bằng Trí tuệ Nhân tạo thế hệ mới (Sử dụng mô hình ngôn ngữ lớn để chấm điểm phù hợp - `fitScore`).
* Soạn thảo Thư ứng tuyển (Cover Letter) cá nhân hóa, chuyên sâu bằng Tiếng Việt theo văn phong chuyên nghiệp của kỹ thuật điều khiển tự động hóa.
* Hỗ trợ quy trình nộp hồ sơ an toàn dạng **Bán tự động (Semi-Autonomous)**, tự động điền thông tin và dừng lại kiểm duyệt thủ công nút gửi cuối cùng để bảo mật tuyệt đối và tránh cơ chế chống bot (anti-bot triggers).

---

## 2. Kiến trúc Hệ thống & Luồng Dữ liệu (System Architecture)

Hệ thống được thiết kế theo mô hình lai **Full-Stack (Client-Server)** sử dụng **React (Vite) + Express (TypeScript)** chạy trong container Cloud Run:

```
                  ┌────────────────────────┐
                  │    Trình duyệt Client   │ <─── Real-time Websocket/SSE Logs
                  │   (React + Tailwind)   │
                  └───────────┬────────────┘
                              │ API Requests
                              ▼
                  ┌────────────────────────┐
                  │   Express Backend API   │ <─── Biến môi trường GEMINI_API_KEY
                  │     (server.ts)        │
                  └─────┬────────────┬─────┘
                        │            │
         Đọc/Ghi dữ liệu│            │ Gửi prompt phân tích
                        ▼            ▼
             ┌──────────────────┐  ┌──────────────────────┐
             │ Lưu trữ bền vững │  │ Google Gemini LMM API│
             │ (File-based DB)  │  │   (Model selected)   │
             │ /storage/jobs    │  └──────────────────────┘
             │  /config/config  │
             └──────────────────┘
```

### 2.1. Server-side Backend (`server.ts`)
* **Vai trò:** Xử lý và phân phối thông tin an toàn, lưu trữ cấu hình tìm kiếm, trực tiếp giao tiếp với Gemini API mà không lo lộ Key bảo mật ở Client-side.
* **Các Endpoint API chính:**
  * `GET /api/config`: Đọc cấu hình từ khóa, địa điểm, các nền tảng mục tiêu và cài đặt anti-bot.
  * `POST /api/config`: Lưu và đồng bộ cấu hình người dùng.
  * `GET /api/profile`: Đọc hồ sơ Master Profile đầy đủ của ứng viên Võ Diệp Quốc Tuấn (`/storage/master_profile.md`).
  * `POST /api/profile`: Cập nhật nâng cấp Master Profile.
  * `GET /api/jobs`: Đọc danh sách các công việc đã quét và trạng thái ứng tuyển từ cơ sở dữ liệu `/storage/jobs.json`.
  * `POST /api/jobs/apply`: Thực thi kích hoạt trình tự động điền hồ sơ Playwright (chạy bán tự động an toàn).
  * `GET /api/scrape`: Cào quét dữ liệu trực tuyến đồng bộ các nền tảng được người dùng lựa chọn.

### 2.2. Client-side Frontend (React)
* **Giao diện người dùng đơn giản, hiện đại:** Sử dụng bảng màu Dark Mode huyền bí (Cosmic Slate Theme), kết hợp font hiển thị "Inter" sắc nét và "JetBrains Mono" cho dữ liệu kỹ thuật mô phỏng.
* **Chia tách Component khoa học:**
  * `App.tsx`: Quản lý chung trạng thái Route và Tabs.
  * `ProfileTab.tsx`: Trực quan hóa và chỉnh sửa Master CV.
  * `ConfigTab.tsx`: Bảng điều khiển chọn Nền tảng tuyển dụng, bật tắt Từ khóa thông minh, cấu hình Anti-Bot.
  * `JobsTab.tsx`: Bảng quản lý tin tuyển dụng đã cào, kiểm tra độ tương thích AI, tạo Cover Letter tự động và theo dõi nhật trình nộp đơn thời gian thực.

---

## 3. Các Tính năng Đột phá Thiết kế (Key Engineering Features)

### 3.1. Hành vi Mặc định Không Chọn Nền tảng (Default Clean State Routing)
* **Thiết lập an toàn:** Mặc định các nền tảng tuyển dụng đều tắt (`false`) trong tệp cấu hình ban đầu.
* **Cơ chế tìm kiếm hướng tâm:** Khi người dùng click chọn nền tảng nào trong cài đặt, tiến trình cào dữ liệu (`/api/scrape`) mới tập hợp các URL tìm kiếm tương ứng của kênh đó, cải thiện hiệu suất mạng và tránh quét rác. Nếu không chọn nền tảng nào, hệ thống thông minh sẽ chặn và cảnh báo thân thiện ngay trên giao diện log thay vì gửi request lỗi.

### 3.2. Chế độ An toàn Bán tự động (Enforced Semi-Autonomous Mode)
* **Bối cảnh:** Các nền tảng như LinkedIn, VietnamWorks áp dụng công nghệ Cloudflare và ReCAPTCHA cực kỳ nghiêm ngặt nhằm chặn nộp đơn tự động bằng headless browser.
* **Giải pháp:** Cố định cài đặt an toàn **Bán tự động**. Trình thu thập dữ liệu Playwright dừng lại tại bước kiểm duyệt cuối cùng, giữ nguyên biểu mẫu điền đầy tự động và đợi người dùng click "Nộp" thủ công. Bảo vệ uy tín thương hiệu cá nhân của ứng viên.

### 3.3. Tích hợp Thông tin Liên kết Tin gốc (Direct Authentic Sourcing Links)
* Toàn bộ tin tuyển dụng đi kèm trạng thái **"Có hiệu lực"** (Active Status) rực cháy trên góc thẻ.
* Cung cấp nút **"Xem tin gốc"** hoặc **"Kiểm chứng nguồn"** liên kết thẳng đến trang việc làm thuộc:
  * `https://www.linkedin.com/jobs/view/{jobId}`
  * `https://www.vietnamworks.com/...`
  * `https://www.topcv.vn/...`
* Đảm bảo tính minh bạch thiết thực nhất của dữ liệu, không sử dụng dữ liệu giả mạo.

---

## 4. Công nghệ & Tài nguyên Thiết kế (Technology Stack)

* **UI Engine:** React 18 / Vite / TypeScript.
* **Styling Framework:** Tailwind CSS 4.0 với các lớp tùy chỉnh mờ đục sương khói mờ ảo (glassmorphism/backdrop filters).
* **Icon Set:** `lucide-react` (Sử dụng biểu tượng nhất quán như `Globe`, `FileText`, `Settings`, `Activity`, v.v.).
* **AI Model SDK:** `@google/genai` (Google Gen AI SDK thế hệ mới nhất cho hiệu quả xử lý tối đa của dòng mô hình Gemini 2.x/3.x).
* **Bền vững Dữ liệu:** Đồng bộ dạng File-based JSON Database gọn nhẹ tại thư mục `/storage/jobs.json`, đảm bảo an toán dữ liệu người dùng không bị mất đi khi trình duyệt reload.

---

*Tài liệu này được biên soạn cho dự án chiến dịch tìm kiếm việc quản lý tự động hóa của Võ Diệp Quốc Tuấn - Tháng 05/2026.*
