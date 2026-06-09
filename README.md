# AutoJob Pro - Trợ lý Tìm kiếm & Ứng tuyển Tự động hóa Thông minh 🤖💼

**AutoJob Pro** là một hệ thống web full-stack, được thiết kế chuyên biệt để giúp các chuyên gia kỹ thuật và quản lý tự động hóa (điển hình như chuyên gia **Võ Diệp Quốc Tuấn**) tối ưu hóa hoàn toàn chiến dịch tiếp cận cơ hội nghề nghiệp. Dự án kết hợp sức mạnh của **Generative AI (Google Gemini)** và cơ chế duyệt tin thông minh giúp cào quét, lọc và tự động soạn thảo Cover Letter tương thích một cách tối ưu nhất.

---

## 🎨 Điểm nổi bật & Tính năng cốt lõi

### 1. Quản lý Nền tảng Tìm kiếm Hướng tâm (Clean Portal Routing)
* **Mặc định tắt an toàn:** Lúc bắt đầu, toàn bộ các nền tảng tuyển dụng (**VietnamWorks, TopCV, LinkedIn**) đều ở trạng thái không chọn.
* **Tìm kiếm theo mục tiêu:** Hệ thống chỉ thực thi quét tin trên đúng các kênh được người dùng chủ động kích hoạt. Tránh lãng phí băng thông và tài nguyên mạng.
* **Cảnh báo thông minh:** Hệ thống hiển thị cảnh báo thân thiện ngay trên nhật trình khi người dùng ấn "Quét tin" nhưng chưa chọn bất kỳ nền tảng nào.

### 2. Minh bạch Thông tin & Liên kết Tin thực tế 🌐
* **Tin tuyển dụng đang hoạt động:** Mỗi tin tuyển dụng được cào quét đều đính kèm trạng thái hoạt động rực sáng để đảm bảo thông tin chuẩn xác.
* **Xem tin trực tiếp:** Cung cấp tính năng **"Xem tin gốc"** hoặc **"Kiểm chứng nguồn"** liên kết trực tiếp tới bài đăng thực tế giúp ứng viên dễ dàng đối chiếu:
  * LinkedIn: `https://www.linkedin.com/jobs/view/{id}`
  * VietnamWorks: `https://www.vietnamworks.com/...`
  * TopCV: `https://www.topcv.vn/...`

### 3. Quy chế Bán tự động Bảo mật (Safeguarded Semi-Autonomous Mode) 🛡️
* **Chống chặn bot:** Các nền tảng tuyển dụng áp dụng cơ chế chống bot chặt chẽ (Cloudflare & Captcha).
* **Đảm bảo uy tín:** Hệ thống cố định chế độ **Bán tự động**. Trình tự động điền sẽ hoàn tất mọi bước, đính kèm CV chính chủ của Võ Diệp Quốc Tuấn, viết sẵn Cover Letter cá nhân hóa và **dừng lại trước nút Gửi cuối cùng** để ứng viên kiểm duyệt thủ công, loại bỏ rủi ro gửi nhầm nội dung lỗi hoặc bị khóa tài khoản.

### 4. Đánh giá Mức độ Thích ứng sâu bằng Gemini AI 🧠
* **Phân tích JD (Job Description):** So sánh Master Profile (`/storage/master_profile.md`) với JD của nhà tuyển dụng.
* **Chấm điểm Fit Score (0-100%):** Đánh giá khách quan dựa trên kỹ năng PLC/SCADA, năm kinh nghiệm quản lý, tiêu chuẩn thẩm định (FDA 21 CFR, GAMP-5, ISO) và ngoại ngữ.
* **Tự soạn Cover Letter:** Tạo thư ứng tuyển chuẩn kỹ sư tự động hóa, điền đầy đủ thông tin cá nhân của Võ Diệp Quốc Tuấn và thông tin đối tác mà không sử dụng placeholder rác.

---

## 🛠️ Công nghệ Sử dụng (Technology Stack)

* **Font & Giao diện:** Sử dụng font display khoa học **Inter** kết hợp **JetBrains Mono** mang hơi hướng công nghiệp hiện đại, hiển thị bảng màu tối mờ ảo (Cosmic Slate Theme).
* **Frontend:** React 18 / Vite / TypeScript.
* **Styling:** Tailwind CSS tích hợp các hiệu ứng tối giản mờ sương (backdrop-blur glassmorphism).
* **Icons:** `lucide-react` cho toàn bộ các biểu tượng trực quan.
* **Backend:** Express Server (TypeScript) chạy song song với Vite Dev Mode.
* **AI Model:** Google Gemini LMM (Sử dụng `@google/genai` SDK thế hệ mới nhất).
* **Storage:** Cơ sở dữ liệu lưu dưới dạng tệp tin cục bộ `/storage/jobs.json` giúp dữ liệu bền vững không bị mất khi refesh trình duyệt.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy nhanh

### 1. Khai báo Biến môi trường
Tạo tệp `.env` tại thư mục gốc và khai báo Gemini API Key (Backend tự load bảo mật, không lộ ra Client):
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 2. Cấu hình cài đặt
Chương trình đã được cấu hình mặc định sẵn file từ khóa tuyển dụng tại `/config/keywords.json` và Master Profile chuyên sâu tại `/storage/master_profile.md`.

---

*Phát triển chuyên biệt cho hồ sơ năng lực của Kỹ sư Võ Diệp Quốc Tuấn — Dự án chiến dịch OEE Smart Career 2026.*
