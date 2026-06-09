import React, { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Play, AlertOctagon, RotateCcw, Cookie, Key, RefreshCw, Cpu, CheckCircle2, ShieldAlert, Zap } from "lucide-react";
import { SessionState, LogLine } from "../types";

interface ConsoleTabProps {
  session: SessionState | null;
  onRefreshSession: () => void;
  onTriggerJobsReload: () => void;
  activeKeywords: string[];
  activeLocation: string;
}

export default function ConsoleTab({
  session,
  onRefreshSession,
  onTriggerJobsReload,
  activeKeywords,
  activeLocation
}: ConsoleTabProps) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  
  const terminalDocRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Scroll terminal to view on new log records
    if (terminalDocRef.current) {
      terminalDocRef.current.scrollTop = terminalDocRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const addLogLocal = (text: string, percent: number, type: LogLine["type"] = "log") => {
    const newRecord: LogLine = {
      text: `[${new Date().toLocaleTimeString('vi-VN')}] ${text}`,
      timestamp: new Date().toLocaleTimeString(),
      percent,
      type
    };
    setLogs((prev) => [...prev, newRecord]);
    setProgress(percent);
  };

  const handleRunLogin = () => {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setProgress(0);
    setActiveTask("login");
    addLogLocal("Đang gửi chỉ thị kích hoạt Automation Login...", 3, "info");

    const es = new EventSource("/api/session/login-simulation");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        addLogLocal("Hoàn thành Quy trình Ghi nhận Phiên Đăng nhập!", 100, "success");
        es.close();
        setRunning(false);
        setActiveTask(null);
        onRefreshSession();
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        const newRecord: LogLine = {
          text: payload.log,
          timestamp: new Date().toLocaleTimeString(),
          percent: payload.percent,
          type: payload.type || "log"
        };
        setLogs((prev) => [...prev, newRecord]);
        setProgress(payload.percent);
      } catch (e) {}
    };

    es.onerror = () => {
      addLogLocal("Đã xảy ra lỗi kết nối SSE đến dịch vụ Playwright.", 0, "warn");
      es.close();
      setRunning(false);
      setActiveTask(null);
    };
  };

  const handleRunScraper = () => {
    if (running) return;
    setRunning(true);
    setLogs([]);
    setProgress(0);
    setActiveTask("scraper");
    addLogLocal(`Khởi động Robot cào tin cho địa điểm "${activeLocation}"...`, 3, "info");

    const kwsParam = encodeURIComponent(activeKeywords.join(","));
    const locParam = encodeURIComponent(activeLocation);
    const es = new EventSource(`/api/scraper/run-simulation?keywords=${kwsParam}&location=${locParam}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        addLogLocal("Hoàn thành quy trình quét tin thành công!", 100, "success");
        es.close();
        setRunning(false);
        setActiveTask(null);
        onTriggerJobsReload(); // Reload main listings table
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        const newRecord: LogLine = {
          text: payload.log,
          timestamp: new Date().toLocaleTimeString(),
          percent: payload.percent,
          type: payload.type || "log"
        };
        setLogs((prev) => [...prev, newRecord]);
        setProgress(payload.percent);
        
        // If a new job was found, trigger early database check
        if (payload.log.includes("ĐÃ TÌM THẤY & THÊM VIỆC LÀM MỚI")) {
          onTriggerJobsReload();
        }
      } catch (e) {}
    };

    es.onerror = () => {
      addLogLocal("Đã xảy ra lỗi kết nối với Scraper API engine.", 0, "warn");
      es.close();
      setRunning(false);
      setActiveTask(null);
    };
  };

  const clearSession = async () => {
    if (running) return;
    try {
      addLogLocal("Đang gửi lệnh yêu cầu xóa/reset phiên Cookies đã tải...", 5, "info");
      const res = await fetch("/api/session/reset", { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
      addLogLocal("Xóa tập tin Cookies thành công. Cần chạy lại Đăng nhập lần đầu để tự động hóa.", 100, "warn");
      onRefreshSession();
    } catch (e) {
      addLogLocal("Không tìm thấy tệp session_state.json hoặc không thể ghi đè.", 100, "warn");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="console-tab-root">
      
      {/* Sidebar: Engine status & Triggers */}
      <div className="space-y-6">
        
        {/* Module 1: Auth & Login cookies card */}
        <div className="bg-[#1E293B] rounded-xl border border-slate-700 shadow-md p-5 text-slate-300" id="vjaa-session-card">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Tính năng Duy trì Phiên</h3>
            </div>
            {session?.loggedIn ? (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                ● Đăng nhập Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-500/30">
                ○ Cần Login lần đầu
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono">
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700 text-slate-300">
                <span className="block text-slate-500 text-[9px] mb-0.5">COOKIE CAPTURED:</span>
                <span className="font-semibold text-white">{session?.cookiesCount || 0} cookies</span>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700 text-slate-300">
                <span className="block text-slate-500 text-[9px] mb-0.5">LOCAL KEYS:</span>
                <span className="font-semibold text-white">{session?.localStorageKeys?.length || 0} token keys</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span>Account:</span>
                <span className="font-mono text-slate-205 font-medium">{session?.username || "Chưa xác minh"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Session Backup:</span>
                <span className="font-mono text-slate-400 font-semibold truncate max-w-[150px]" title={session?.sessionFile}>
                  {session?.sessionFile || "Chưa khởi tạo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last login backup:</span>
                <span className="font-mono text-slate-205 font-medium">
                  {session?.lastLogin ? new Date(session.lastLogin).toLocaleDateString("vi-VN") : "Chưa có"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700 space-y-2">
              <button
                id="btn-trigger-login-sim"
                disabled={running}
                onClick={handleRunLogin}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-semibold text-white shadow-inner cursor-pointer transition-colors disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Đăng Nhập Lần Đầu & Ghé Cookies</span>
              </button>

              <button
                id="btn-reset-cookies"
                disabled={running || !session?.loggedIn}
                onClick={clearSession}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Phiên Đăng Nhập</span>
              </button>
            </div>
          </div>
        </div>

        {/* Module 2: Scraping Action controller */}
        <div className="bg-[#1E293B] rounded-xl border border-slate-700 shadow-md p-5 text-slate-300" id="vjaa-scraper-ctrl">
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-700 mb-4">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">Robot Quản lý Quét Tin</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Quét việc dựa trên danh bạ <span className="font-semibold text-emerald-400">{activeKeywords.length} từ khóa</span> vừa lập cấu hình tại tỉnh <span className="font-bold text-white">{activeLocation}</span>.
          </p>

          <button
            id="btn-run-scraper-sim"
            disabled={running || !session?.loggedIn}
            onClick={handleRunScraper}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sky-600 hover:bg-sky-505 text-white disabled:bg-slate-800 disabled:text-slate-600 text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Play className="w-4 h-4 stroke-[3]" />
            <span>KÍCH HOẠT ROBOT QUÉT TIN MỚI</span>
          </button>

          {!session?.loggedIn && (
            <div className="mt-3 p-3 bg-red-950/20 rounded-lg border border-red-900/40 text-[10px] text-red-450 leading-relaxed flex items-start gap-1.5 animate-fade-in">
              <AlertOctagon className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>DỪNG:</strong> Bạn chưa thiết lập Cookies Đăng nhập. Hãy chạy nút "Đăng Nhập Lần Đầu" ở trên để vượt CAPTCHA tuyển dụng trước khi chạy Robot cào dữ liệu.
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Main Column: Live Streaming Terminal Terminal */}
      <div className="lg:col-span-2 flex flex-col h-[520px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl" id="terminal-wrapper">
        
        {/* Terminal Header */}
        <div className="bg-slate-900/90 border-b border-slate-950 px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <TerminalIcon className="w-4.5 h-4.5 text-emerald-400" />
            <span className="font-mono text-xs font-semibold text-slate-350 select-none">TERMINAL - LOGS HOẠT ĐỘNG AGENT</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${running ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="font-mono text-[10px] font-semibold text-slate-400">
              {running 
                ? `ĐANG VẬN HÀNH (${progress}%)` 
                : "HỆ THỐNG SẴN SÀNG"
              }
            </span>
          </div>
        </div>

        {/* Live Progress Bar indicator */}
        <div className="w-full h-1 bg-slate-900 select-none">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Terminal Display screen */}
        <div 
          id="terminal-stdout-container"
          ref={terminalDocRef}
          className="flex-1 overflow-y-auto p-4 md:p-5 font-mono text-xs text-slate-300 space-y-2 bg-slate-950/90 leading-relaxed select-text"
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-6 select-none">
              <Zap className="w-10 h-10 text-slate-700 mb-2.5 stroke-[1.5]" />
              <p className="font-semibold text-slate-600">Trình Điều Khiển Thiết Bị Rỗng</p>
              <p className="text-[11px] text-slate-705 mt-1 max-w-xs">Nhấp vào một trong các kích hoạt ở thanh bên trái để khởi nguồn dòng nhật ký Playwright...</p>
            </div>
          ) : (
            logs.map((log, idx) => {
              let colorClass = "text-slate-300";
              if (log.type === "success") colorClass = "text-emerald-400 font-semibold";
              if (log.type === "warn") colorClass = "text-amber-400 font-semibold";
              if (log.type === "info") colorClass = "text-sky-400";

              return (
                <div key={idx} id={`term-line-${idx}`} className={`grid grid-cols-1 select-text border-l-2 pl-3.5 py-0.5 border-slate-900/60 ${colorClass} animate-fade-in hover:bg-slate-900/30 transition-colors`}>
                  <p className="whitespace-pre-wrap">{log.text}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Terminal Footer block */}
        <div className="bg-slate-900/80 border-t border-slate-950/40 px-4 py-2 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0 select-none">
          <span>ROOT@VIETNAM-JOB-AGENT:~$ ./run_playwright.sh</span>
          <span>UTF-8 | Playwright Chromium HEADLESS</span>
        </div>
      </div>

    </div>
  );
}
