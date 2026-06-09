import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Ensure storage and config directories exist
const storageDir = path.join(process.cwd(), "storage");
const configDir = path.join(process.cwd(), "config");
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("MY_GEMINI_API_KEY")) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// REST API ROUTES

// 1. Master Profile Endpoints
const PROFILE_PATH = path.join(storageDir, "master_profile.md");
app.get("/api/profile", (req, res) => {
  try {
    if (fs.existsSync(PROFILE_PATH)) {
      const content = fs.readFileSync(PROFILE_PATH, "utf-8");
      res.json({ content });
    } else {
      res.json({ content: "" });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to read master profile: " + error.message });
  }
});

app.post("/api/profile", (req, res) => {
  try {
    const { content } = req.body;
    if (content === undefined || content === null) {
      return res.status(400).json({ error: "Content is required" });
    }
    fs.writeFileSync(PROFILE_PATH, content, "utf-8");
    res.json({ success: true, message: "Profile saved successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to write master profile: " + error.message });
  }
});

// 2. Settings Config Endpoints
const CONFIG_PATH = path.join(configDir, "keywords.json");
app.get("/api/config", (req, res) => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      res.json(config);
    } else {
      res.json({
        keywords: ["Automation Manager", "Trưởng phòng Điện", "PLC Siemens"],
        location: "Ho Chi Minh",
        platforms: { vietnamworks: false, topcv: false, linkedin: false, careerbuilder: false, itviec: false },
        antiBotConfig: { humanDelayMin: 3, humanDelayMax: 7, userAgentSpoofing: true, semiAutonomous: true }
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to read configuration: " + error.message });
  }
});

app.post("/api/config", (req, res) => {
  try {
    const configData = req.body;
    if (configData && configData.antiBotConfig) {
      configData.antiBotConfig.semiAutonomous = true;
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), "utf-8");
    res.json({ success: true, message: "Configuration saved successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to write configuration: " + error.message });
  }
});

// 3. Browser Session persistence endpoints
const SESSION_PATH = path.join(storageDir, "session_state.json");
app.get("/api/session", (req, res) => {
  try {
    if (fs.existsSync(SESSION_PATH)) {
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8"));
      res.json(session);
    } else {
      res.json({ loggedIn: false });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to read session state: " + error.message });
  }
});

app.post("/api/session/reset", (req, res) => {
  try {
    const defaultSession = {
      loggedIn: false,
      lastLogin: null,
      username: "",
      cookiesCount: 0,
      localStorageKeys: [],
      sessionFile: "storage/session_state.json"
    };
    fs.writeFileSync(SESSION_PATH, JSON.stringify(defaultSession, null, 2), "utf-8");
    res.json(defaultSession);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reset session state: " + error.message });
  }
});

// Long-running simulation endpoint: Login first-time
app.get("/api/session/login-simulation", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (message: string, percent: number, type: "info" | "success" | "warn" | "log" = "info") => {
    res.write(`data: ${JSON.stringify({ log: `[${new Date().toLocaleTimeString('vi-VN')}] ${message}`, percent, type })}\n\n`);
  };

  sendLog("Khởi chạy Playwright engine... (Chế độ hiển thị HEADED)", 10, "info");
  
  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step === 1) {
      sendLog("Trình duyệt Chromium được mở thành công. Đang tải trang đăng nhập VietnamWorks...", 20, "log");
    } else if (step === 2) {
      sendLog("Phát hiện màn hình đăng nhập. Đang đợi người dùng nhập thông tin thủ công và giải quyết mã CAPTCHA/Cloudflare...", 40, "warn");
    } else if (step === 3) {
      sendLog("Chờ đợi người dùng điền Email & Mật khẩu (60 giây còn lại)...", 50, "info");
    } else if (step === 4) {
      sendLog("Phát hiện hành động click nút Đăng Nhập. Đang xác thực OTP & Captcha...", 70, "log");
    } else if (step === 5) {
      sendLog("Đăng nhập THÀNH CÔNG! Đang trích xuất Cookie, Token xác thực và trạng thái LocalStorage...", 85, "success");
    } else if (step === 6) {
      // Write the loggedIn session to file
      const activeSession = {
        loggedIn: true,
        lastLogin: new Date().toISOString(),
        username: "tuanvo.kta@gmail.com",
        cookiesCount: 24,
        localStorageKeys: ["vietnamworks_user_token", "vietnamworks_session_id", "topcv_auth_payload"],
        sessionFile: "storage/session_state.json"
      };
      fs.writeFileSync(SESSION_PATH, JSON.stringify(activeSession, null, 2), "utf-8");
      
      sendLog(`Đã lưu phiên hoạt động (Session State) an toàn vào: ${SESSION_PATH}`, 100, "success");
      clearInterval(interval);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }, 3000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

// 4. Job Listings endpoints
const JOBS_PATH = path.join(storageDir, "jobs.json");
app.get("/api/jobs", (req, res) => {
  try {
    if (fs.existsSync(JOBS_PATH)) {
      const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
      res.json(jobs);
    } else {
      res.json([]);
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to read jobs listings: " + error.message });
  }
});

app.post("/api/jobs/add", (req, res) => {
  try {
    const { title, company, location, salary, description, source } = req.body;
    if (!title || !company || !description) {
      return res.status(400).json({ error: "Title, company, and description are required" });
    }

    let jobs = [];
    if (fs.existsSync(JOBS_PATH)) {
      jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
    }

    const newJob = {
      id: "custom-" + Date.now(),
      title,
      company,
      location: location || "Ho Chi Minh City",
      salary: salary || "Thỏa thuận",
      url: "Custom Input",
      source: source || "custom",
      originalKeywords: ["Custom"],
      dateScraped: new Date().toISOString(),
      status: "Scraped",
      description
    };

    jobs.unshift(newJob);
    fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
    res.json(newJob);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save job: " + error.message });
  }
});

app.post("/api/jobs/reset-defaults", (req, res) => {
  try {
    const defaultJobs = [
      {
        id: "job-001",
        title: "Trưởng phòng Tự động hóa (Automation Manager)",
        company: "Suntory PepsiCo Vietnam Beverage",
        location: "Ho Chi Minh City",
        salary: "35,000,000 - 55,000,000 VND",
        url: "https://www.vietnamworks.com/automation-manager-pepsico-vjia-001",
        source: "vietnamworks",
        originalKeywords: ["Automation Manager", "Trưởng phòng Điện"],
        dateScraped: new Date().toISOString(),
        status: "Scraped",
        description: "Yêu cầu công việc:\n- Quản lý toàn bộ hệ thống điện, điều khiển và tự động hóa dây chuyền sản xuất nước giải khát PepsiCo.\n- Lập trình, sửa lỗi và tối ưu hệ thống PLC Siemens S7-1500, S7-300, mạng Profinet/Modbus TCP.\n- Quản lý và hướng dẫn kỹ thuật cho đội ngũ 6 kỹ sư điện tại nhà máy Cần Thơ hoặc Hóc Môn.\n- Kinh nghiệm thiết kế tủ điện điều khiển sử dụng phần mềm EPLAN Electric P8.\n- Phối hợp với các đối tác nước ngoài để triển khai cài đặt các thiết bị cơ điện và cánh tay bốc xếp robot tự động.\n- Quản lý ngân sách bảo trì, đấu thầu BOQ cho các dự án mở rộng nhà máy lên tới vài triệu USD.\n- Yêu cầu: 7+ năm kinh nghiệm, Tiếng Anh giao tiếp tốt (IELTS > 6.0 hoặc tương đương)."
      },
      {
        id: "job-002",
        title: "Senior PLC Control Specialist (Automation Lead)",
        company: "Schaeffler Vietnam Co., Ltd.",
        location: "Amata Industrial Zone, Dong Nai (HCMC Shuttle Bus)",
        salary: "1,500 - 2,500 USD",
        url: "https://www.topcv.vn/job/senior-plc-control-specialist-schaeffler-vjia-002",
        source: "topcv",
        originalKeywords: ["PLC Siemens", "Kỹ sư Tự động hóa"],
        dateScraped: new Date().toISOString(),
        status: "Scraped",
        description: "Job Requirements:\n- Design, program and maintain PLC programs using TIA Portal (S7-1500, S7-1200) and Siemens Safety standard codes.\n- Define specification for industrial interfaces (OPC UA, Ethernet/IP, Profinet) to link machinery tools with manufacturing execution system (MES).\n- Commissioning and troubleshooting variable frequency drives (VFD) and complex Servo Motors (Sinamics S120, V90) for high-speed automated assembly lines.\n- Read and audit electrical drawings with EPLAN Electric P8.\n- Leads FAT/SAT testings and coordinates with German experts.\n- Qualifications: Bachelor or higher in Electrical Engineering or Automation, 5+ years of programming experience, strong analytical skills, fluent English."
      },
      {
        id: "job-003",
        title: "Kỹ Sư Thiết Kế Điện & EPLAN",
        company: "Intel Products Vietnam",
        location: "District 9 High-Tech Park, Ho Chi Minh City",
        salary: "Thỏa thuận",
        url: "https://www.topcv.vn/job/ky-su-thiet-ke-dien-eplan-intel-products-vietnam-vjia-003",
        source: "topcv",
        originalKeywords: ["Kỹ sư Tự động hóa"],
        dateScraped: new Date().toISOString(),
        status: "Applied",
        dateApplied: new Date().toISOString(),
        coverLetter: "Kính gửi Bộ phận Tuyển dụng Intel Products Vietnam,\n\nTôi là Võ Diệp Quốc Tuấn, Thạc sĩ Kỹ thuật – Kỹ thuật Tự động hóa với hơn một thập kỷ kinh nghiệm kiến tạo và điều hành các hệ thống tự động hóa công nghiệp...\n",
        description: "Mô tả công việc:\n- Tập trung thiết kế sơ đồ nguyên lý mạch động lực, mạch điều khiển và tủ phân phối điện điện tử công nghiệp bằng phần mềm EPLAN Electric P8.\n- Bốc tách danh mục khối lượng vật tư thiết bị điện (BOQ), lựa chọn thiết bị Aptomat, Contactor, Terminal, biến tần chính hãng Schneider, ABB hoặc Mitsubishi.\n- Hỗ trợ triển khai gá lắp đấu nối tủ điện tại nhà xưởng, hạn chế lỗi đấu dây.\n- Ít yêu cầu viết mã lập trình PLC, tập trung chủ yếu vào tính toán phụ tải, thiết kế layout tủ điện 2D/3D và đảm bảo tiêu chuẩn điện IEC-60439.\n- Yêu cầu: 3+ năm làm việc với EPLAN, thành thạo AutoCAD Electrical, chấp nhận làm việc theo ca dự án."
      },
      {
        id: "job-004",
        title: "Senior Java Developer (Microservices / Cloud)",
        company: "FPT Software HCM",
        location: "F-Town, District 9, Ho Chi Minh City",
        salary: "2,000 - 3,500 USD",
        url: "https://vietnamworks.com/senior-java-developer-fpt-software-vjia-004",
        source: "vietnamworks",
        originalKeywords: ["Automation Manager"],
        dateScraped: new Date().toISOString(),
        status: "Scraped",
        description: "Job Description:\n- Design and implement highly scalable Java applications utilizing Spring Boot, Spring Cloud, and AWS Serverless architecture.\n- Build robust RESTful APIs and handle microservices messaging layers using Kafka and RabbitMQ.\n- Develop query and indexing optimizations in MongoDB, PostgreSQL, and Redis.\n- Manage CI/CD pipelines deploying Docker containers to Kubernetes, leveraging Jenkins & GitLab CI.\n- Position Requirements: 5+ years of software design with Java/Spring, familiarity with AWS cloud hosting, strong knowledge of software engineering principles. No industrial hardware or PLC knowledge is relevant for this backend position."
      },
      {
        id: "job-005",
        title: "Director of Engineering & Intelligent Manufacturing",
        company: "LEGO Group Manufacturing Vietnam",
        location: "Binh Duong IP (HCMC Free shuttle bus)",
        salary: "4,500 - 6,500 USD",
        url: "https://www.linkedin.com/jobs/view/902741574-lego-direct-eng-005",
        source: "linkedin",
        originalKeywords: ["Engineering Manager", "Production Manager"],
        dateScraped: new Date().toISOString(),
        status: "Scraped",
        description: "Yêu cầu công việc:\n- Quản lý và thiết lập chiến lược đổi mới công nghệ sản xuất thông minh tại nhà máy LEGO tỷ đô trung hòa carbon Bình Dương.\n- Lãnh đạo điều phối đội ngũ liên phòng ban kỹ thuật liên quan đến tự động hóa nâng cao, thiết kế robot Lego thông minh.\n- Thiết lập các định hướng số hóa nhà máy thông qua Enterprise Digital Twin, hệ thống AI chẩn đoán lỗi thiết bị dập ghim nhựa chính xác.\n- Giám sát việc thực hiện bảo trì kỹ thuật chuẩn OEE > 92% và các tiêu chuẩn an toàn máy móc IEC 61508, FDA, GAMP-5.\n- Yêu cầu: Trên 10 năm kinh nghiệm quản trị sản xuất kỹ thuật quy mô lớn, tiếng Anh lưu loát xuất sắc, am hiểu tự động hóa công nghệ cao."
      }
    ];

    fs.writeFileSync(JOBS_PATH, JSON.stringify(defaultJobs, null, 2), "utf-8");
    res.json(defaultJobs);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to reset default jobs: " + error.message });
  }
});

// Update single job status/content
app.post("/api/jobs/update", (req, res) => {
  try {
    const updatedJob = req.body;
    if (!updatedJob.id) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    if (fs.existsSync(JOBS_PATH)) {
      const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
      const index = jobs.findIndex((j: any) => j.id === updatedJob.id);
      if (index !== -1) {
        jobs[index] = { ...jobs[index], ...updatedJob };
        fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
        return res.json(jobs[index]);
      }
    }
    res.status(404).json({ error: "Job not found" });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update job: " + error.message });
  }
});


// 5. Scraper Simulation Stream
app.get("/api/scraper/run-simulation", (req, res) => {
  const keywordsParam = req.query.keywords as string || "";
  const locationParam = req.query.location as string || "Ho Chi Minh";
  const selectedKeywords = keywordsParam ? keywordsParam.split(",") : ["PLC Siemens"];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (message: string, percent: number, data?: any) => {
    res.write(`data: ${JSON.stringify({ log: `[${new Date().toLocaleTimeString('vi-VN')}] ${message}`, percent, data })}\n\n`);
  };

  sendLog(`Bắt đầu chạy Job Scraping Engine tại địa điểm: ${locationParam}...`, 5);
  sendLog(`Sử dụng Cookies từ: ${SESSION_PATH} để vượt Cloudflare/Captcha...`, 15);

  let currentKeywordIdx = 0;
  
  const processNextKeyword = () => {
    if (currentKeywordIdx >= selectedKeywords.length) {
      sendLog("Hoàn tất cào dữ liệu cho tất cả từ khóa đã chọn!", 95);
      
      // Simulate adding scraped jobs or updating database
      sendLog("Đối chiếu trùng lặp với SQLite database... Phát hiện 0 trùng lặp.", 100);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const keyword = selectedKeywords[currentKeywordIdx];
    const percentage = Math.floor(15 + (currentKeywordIdx / selectedKeywords.length) * 80);

    let activePlatforms: string[] = [];
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        if (cfg && cfg.platforms) {
          activePlatforms = Object.keys(cfg.platforms).filter(p => cfg.platforms[p] === true && (p === "vietnamworks" || p === "topcv" || p === "linkedin"));
        }
      } catch (e) {}
    }

    if (activePlatforms.length === 0) {
      sendLog(`[CÀO TIN] [CẢNH BÁO] Không có nền tảng tuyển dụng nào được chọn trong cấu hình!`, percentage);
      sendLog(`[CÀO TIN] Đăng ký hoặc kích hoạt ít nhất một kênh (VietnamWorks, TopCV, hoặc LinkedIn) tại Cài đặt.`, 100);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const platformNamesStr = activePlatforms.map(p => {
      if (p === "vietnamworks") return "VietnamWorks.com";
      if (p === "topcv") return "TopCV.vn";
      if (p === "linkedin") return "LinkedIn.com";
      return p;
    }).join(" & ");

    sendLog(`[CÀO TIN] Chuyển đổi URL tìm kiếm mục tiêu: ${platformNamesStr}`, percentage);
    sendLog(`[CÀO TIN] Đang quét các vị trí tuyển dụng ứng với từ khóa: "${keyword}"...`, percentage + 5);

    setTimeout(() => {
      sendLog(`[CÀO TIN] Sử dụng Infinite Scroll, đã cuộn qua 3 trang danh sách...`, percentage + 10);
      
      // Simulate finding a job
      const randomDelay = Math.random();
      if (randomDelay > 0.3) {
        const salaryRange = randomDelay > 0.65 ? "30,000,000 - 45,000,000 VND" : "25,000,000 - 35,000,000 VND";
        const platform = activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
        
        let jobUrl = "";
        if (platform === "linkedin") {
          jobUrl = `https://www.linkedin.com/jobs/view/${1000000 + Math.floor(Math.random() * 9000000)}`;
        } else if (platform === "vietnamworks") {
          jobUrl = `https://www.vietnamworks.com/ky-su-tu-dong-hoa-${currentKeywordIdx}-1600000-jv`;
        } else {
          jobUrl = `https://www.topcv.vn/viec-lam/ky-su-dien-dien-tu-automation-senior-${currentKeywordIdx}`;
        }
        
        const dynamicJob = {
          id: `scraped-${Date.now()}-${currentKeywordIdx}`,
          title: `Kỹ Sư ${keyword} (Senior)`,
          company: currentKeywordIdx % 2 === 0 ? "FDI Automation Manufacturing Ltd." : "Tập Đoàn Điện Lực & Cơ Điện Tiến Phát",
          location: `${locationParam} City, Vietnam`,
          salary: salaryRange,
          url: jobUrl,
          source: platform,
          originalKeywords: [keyword],
          dateScraped: new Date().toISOString(),
          status: "Scraped",
          description: `Mô tả công việc:\n- Chịu trách nhiệm vận hành, lập trình và lắp đặt hệ thống cho khách hàng FDI liên quan đến ${keyword}.\n- Cài đặt cấu hình mạng Profinet/Modbus TCP, làm việc trực tiếp với TIA Portal và tủ điện có bản vẽ EPLAN.\n- Đảm bảo thực thi kiểm soát chất lượng kỹ thuật, chạy thử FAT/SAT tại dự án ở HCMC hoặc lân cận.\n- Yêu cầu: Trên 3 năm kinh nghiệm thực chiến điều khiển, chủ động học hỏi và đọc hiểu tiếng Anh chuyên ngành.`
        };

        // Write to local database
        try {
          if (fs.existsSync(JOBS_PATH)) {
            const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
            // Check if already exists by title and company to prevent duplicates
            const exists = jobs.some((j: any) => j.title === dynamicJob.title && j.company === dynamicJob.company);
            if (!exists) {
              jobs.unshift(dynamicJob);
              fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
              sendLog(`[HỆ THỐNG] ĐÃ TÌM THẤY & THÊM VIỆC LÀM MỚI: "${dynamicJob.title}" tại ${dynamicJob.company}`, percentage + 15, dynamicJob);
            } else {
              sendLog(`[HỆ THỐNG] Đã lọc trùng việc làm: "${dynamicJob.title}" tại ${dynamicJob.company}`, percentage + 15);
            }
          }
        } catch (e) {}
      } else {
        sendLog(`[HỆ THỐNG] Không tìm thấy tin tuyển dụng mới cho từ khóa: "${keyword}"`, percentage + 15);
      }

      currentKeywordIdx++;
      setTimeout(processNextKeyword, 2000);
    }, 2000);
  };

  setTimeout(processNextKeyword, 1500);
});

// 6. Real Gemini Process Route (Evaluating JD & generating cover letter)
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { jd, profile } = req.body;
    if (!jd || !profile) {
      return res.status(400).json({ error: "Both Job Description and Master Profile are required." });
    }

    const ai = getGemini();

    const prompt = `Bạn là Trợ lý AI cao cấp của Hệ thống Tự Động Hóa Tìm Việc tại Việt Nam (Vietnam Job Automation Agent - VJAA).
Hãy phân tích và đối chiếu chi tiết giữa **Hồ sơ Năng lực (Master Profile) của Ứng viên** và **Bản mô tả công việc (Job Description - JD)** dưới đây.

**YÊU CẦU ĐẦU RA:**
Trả về một đối tượng JSON phân tích có cấu trúc chính xác theo khuôn dạng sau (không viết thêm lời dẫn dắt bên ngoài JSON):
{
  "fitScore": <Đánh giá mức độ phù hợp toàn diện giữa CV và JD trên thang điểm từ 0 đến 100. Hãy đánh giá nghiêm túc dựa trên yêu cầu kỹ năng cứng, kinh nghiệm quản lý, năm kinh nghiệm, kỹ năng lập trình PLC/SCADA và ngoại ngữ>,
  "fitReason": "<Nêu chi tiết 3-4 dòng phân tích thế mạnh tại sao ứng viên phù hợp hoặc chưa phù hợp với công việc này bằng tiếng Việt rõ ràng, khách quan và chuyên nghiệp.>",
  "missingKeywords": [<Mảng các chuỗi chứa các thuật ngữ chuyên môn, từ khóa công nghệ, chứng chỉ, hoặc kỹ năng trọng yếu xuất hiện trong JD nhưng chưa có hoặc chưa được làm nổi bật trong Profile của ứng viên để họ bổ sung vào CV trước khi nộp. VD: "Ignition SCADA", "Safety PLC", "Chứng chỉ IELTS 7.5"...>],
  "coverLetter": "<Nội dung Thư ứng tuyển (Cover Letter) bằng Tiếng Việt ngắn gọn khoảng 150-200 từ, viết theo phong cách chuyên nghiệp, tự tin, lịch thiệp, thuyết phục và thể hiện kiến thức chuyên sâu vững vàng về tự động hóa. Đề cập trực tiếp tới các thế mạnh của ứng viên tương thích với JD này. Không ghi placeholder kiểu [Tên Công Ty] hay [Họ và Tên], mà hãy tự động hóa điền đúng thông tin của ứng viên là 'Võ Diệp Quốc Tuấn' và tên công ty/vị trí mục tiêu từ JD để có một lá thư sẵn sàng gửi đi luôn.>"
}

---
**HỒ SƠ NĂNG LỰC CỦA ỨNG VIÊN (MASTER PROFILE):**
${profile}

---
**BẢN MÔ TẢ CÔNG VIỆC (JOB DESCRIPTION - JD):**
${jd}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fitScore: {
              type: Type.NUMBER,
              description: "Điểm số phù hợp từ 0 đến 100."
            },
            fitReason: {
              type: Type.STRING,
              description: "Giải thích chi tiết thế mạnh và mức độ tương thích."
            },
            missingKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Các kỹ năng hoặc chứng chỉ thiết yếu trong JD nhưng còn thiếu trong Profile."
            },
            coverLetter: {
              type: Type.STRING,
              description: "Bản thư ứng tuyển tùy chỉnh chuyên nghiệp của Võ Diệp Quốc Tuấn."
            }
          },
          required: ["fitScore", "fitReason", "missingKeywords", "coverLetter"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text returned from Gemini API");
    }

    try {
      const parsed = JSON.parse(resultText.trim());
      res.json(parsed);
    } catch (parseError) {
      console.error("Gemini output parsing failed:", resultText);
      res.status(502).json({
        error: "Failed to parse structured JSON from Gemini API",
        rawOutput: resultText
      });
    }

  } catch (error: any) {
    console.error("Gemini analyze endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Interactive Automation Apply Simulation Stream
app.post("/api/jobs/apply-simulation", (req, res) => {
  const { jobId, coverLetter } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: "Job ID is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendLog = (message: string, percent: number, type: "info" | "success" | "warn" | "log" = "info") => {
    res.write(`data: ${JSON.stringify({ log: `[${new Date().toLocaleTimeString('vi-VN')}] ${message}`, percent, type })}\n\n`);
  };

  // Read job details
  let job: any = null;
  try {
    if (fs.existsSync(JOBS_PATH)) {
      const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
      job = jobs.find((j: any) => j.id === jobId);
    }
  } catch (e) {}

  const jobTitle = job ? job.title : "Kỹ sư Tự động hóa";
  const company = job ? job.company : "Công ty mục tiêu";
  const platform = job ? job.source : "vietnamworks";

  // Force-check semiAutonomous from config
  let isSemiAutonomous = true;
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      if (cfg && cfg.antiBotConfig && cfg.antiBotConfig.semiAutonomous !== undefined) {
        isSemiAutonomous = !!cfg.antiBotConfig.semiAutonomous;
      }
    } catch (e) {}
  }

  sendLog(`[AUTOMATION] Bắt đầu kích hoạt tiến trình nộp hồ sơ tự động qua Playwright cho vị trí: "${jobTitle}" tại "${company}"...`, 5, "info");
  
  if (!fs.existsSync(SESSION_PATH) || !JSON.parse(fs.readFileSync(SESSION_PATH, "utf-8")).loggedIn) {
    sendLog("[BÁO LỖI] Không tìm thấy phiên đăng nhập active! Quá trình tự động bị dừng lại. Hãy đăng nhập tài khoản trước.", 15, "warn");
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  sendLog(`[AUTOMATION] Tải thành công phiên Cookies/Token từ: ${SESSION_PATH}`, 15, "success");
  sendLog(`[AUTOMATION] Thiết lập User-Agent trùng khớp trình duyệt cơ sở máy tính thật (Bypass Sân Tuyển Dụng)...`, 25, "log");

  let step = 0;
  const interval = setInterval(() => {
    step++;
    if (step === 1) {
      sendLog(`[AUTOMATION] Điều hướng Playwright ẩn đến liên kết tin: ${job?.url || "https://www.vietnamworks.com/job-apply"}`, 40, "log");
    } else if (step === 2) {
      sendLog(`[AUTOMATION] Trang chủ sân tuyển dụng ${platform.toUpperCase()} phản hồi nhanh. Bỏ qua màn hình pop-up quảng cáo...`, 55, "log");
      sendLog(`[HUMAN_DELAY] Chờ trễ ngẫu nhiên 3.4 giây để giả lập thao tác lăn chuột đọc JD (Anti-bot)...`, 60, "info");
    } else if (step === 3) {
      sendLog(`[AUTOMATION] Tìm thấy phần tử nút 'Nộp Đơn Nhanh' (Apply Now). Thực hiện lệnh CLICK...`, 70, "log");
    } else if (step === 4) {
      sendLog(`[AUTOMATION] Form nộp đơn mở ra. Thực hiện điền tự động nội dung Thư Ứng Tuyển chuyên biệt (Cover Letter)...`, 85, "info");
      if (coverLetter) {
        sendLog(`[CONTENT] Cover Letter dài ${coverLetter.length} ký tự đã được điền trơn tru bằng gõ phím mô phỏng (type simulator)...`, 90, "success");
      }
    } else if (step === 5) {
      sendLog(`[AUTOMATION] Đính kèm tệp CV Gốc 'CV_TuanVo_Senior_Automation.pdf' từ tài khoản lưu sẵn...`, 95, "log");
    } else if (step === 6) {
      if (isSemiAutonomous) {
        sendLog(`[BÁN TỰ ĐỘNG] NHẬN DIỆN CHẾ ĐỘ BẢO MẬT: Đã chặn lệnh tự động nhấp nộp. Giữ nguyên màn hình điền sẵn thông tin...`, 98, "warn");
      } else {
        sendLog(`[AUTOMATION] Thực thi click nút LỰC CHỌN CUỐI CÙNG 'Gửi Hồ Sơ' (Submit Application)...`, 98, "warn");
      }
    } else if (step === 7) {
      if (isSemiAutonomous) {
        sendLog(`[HỆ THỐNG] Đã dừng lại trước nút gửi cuối cùng theo yêu cầu an toàn. Vui lòng kiểm duyệt thủ công thư ứng tuyển của bạn trên giao diện Chrome và click 'Gửi' để hoàn tất. Trạng thái đã được chuyển sang 'Applied' để theo dõi.`, 100, "success");
      } else {
        sendLog(`[HỆ THỐNG] Nộp hồ sơ THÀNH CÔNG cho nhà tuyển dụng "${company}"! Đã cập nhật trạng thái tự động và lưu lịch sử nộp tránh lặp tin.`, 100, "success");
      }
      
      // Update the job status in local jobs database to 'Applied'
      try {
        if (fs.existsSync(JOBS_PATH)) {
          const jobs = JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"));
          const index = jobs.findIndex((j: any) => j.id === jobId);
          if (index !== -1) {
            jobs[index].status = "Applied";
            jobs[index].dateApplied = new Date().toISOString();
            jobs[index].coverLetter = coverLetter || "Mặc định";
            fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
          }
        }
      } catch (e) {}

      clearInterval(interval);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }, 2500);

  req.on("close", () => {
    clearInterval(interval);
  });
});


// Serve static React files and setup Vite
const initServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully in server.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Catch-all route to serve Index.html for SPA router
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets mounted from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vietnam Job Automation Agent backend running on http://0.0.0.0:${PORT}`);
  });
};

initServer().catch((error) => {
  console.error("Failed to bootstrap server:", error);
});
