import React, { useState, useEffect } from "react";
import { 
  Terminal as TerminalIcon, 
  Cpu, 
  Briefcase, 
  FileText, 
  Settings2, 
  Chrome, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Info,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Job, SessionState, VjaaConfig } from "./types";

// Import modular panels
import ConsoleTab from "./components/ConsoleTab";
import JobsTab from "./components/JobsTab";
import ProfileTab from "./components/ProfileTab";
import ConfigTab from "./components/ConfigTab";

interface Toast {
  id: number;
  message: string;
}

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"console" | "jobs" | "profile" | "config">("console");
  
  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [config, setConfig] = useState<VjaaConfig | null>(null);
  const [masterProfile, setMasterProfile] = useState<string>("");
  const [toastList, setToastList] = useState<Toast[]>([]);

  // Loading States
  const [fetchingJobs, setFetchingJobs] = useState<boolean>(false);
  const [loadingApp, setLoadingApp] = useState<boolean>(true);

  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    try {
      setLoadingApp(true);
      await Promise.all([
        fetchSession(),
        fetchJobs(),
        fetchConfig(),
        fetchProfile()
      ]);
    } catch (e) {
      console.error("Bootstrap app has errors: ", e);
    } finally {
      setLoadingApp(false);
    }
  };

  const showToast = (message: string) => {
    const id = Date.now();
    setToastList((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToastList((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (e) {}
  };

  const fetchJobs = async () => {
    try {
      setFetchingJobs(true);
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
    } finally {
      setFetchingJobs(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (e) {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setMasterProfile(data.content || "");
      }
    } catch (e) {}
  };

  if (loadingApp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-slate-100" id="vjaa-app-loading">
        <Cpu className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-slate-100">VJAA CONTROL STATION</h3>
        <p className="text-xs text-slate-400 mt-1 select-none font-mono">Loading data schemas & local files config...</p>
      </div>
    );
  }

  // Active platform names list for display badges
  const getSubscribedPortalsList = () => {
    if (!config) return [];
    return Object.entries(config.platforms)
      .filter(([_, enabled]) => enabled)
      .map(([name]) => name.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 flex flex-col font-sans" id="vjaa-app-viewport">
      
      {/* Upper Global Navigation & Stat ribbon */}
      <header className="bg-[#1E293B] border-b border-slate-700 sticky top-0 z-35 select-none text-white shadow-lg" id="vjaa-global-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & title brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-white font-sans uppercase">VJAA CONTROL PANEL</h1>
                <span className="text-[9px] font-extrabold bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700 tracking-wider">
                  V1.2 SLICK CORES
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Trợ Lý Tự Động Hóa Tìm & Nộp Việc Theo Từ Khóa Kỹ Thuật Việt Nam</p>
            </div>
          </div>

          {/* Core System Status Overview ribbon */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[10.5px]">
            
            {/* Status 1: Playwright session */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg pl-2 pr-2.5 py-1.5" title="Cookies file state">
              <Chrome className={`w-3.5 h-3.5 ${session?.loggedIn ? "text-emerald-400 animate-pulse" : "text-slate-500"}`} />
              <span className="font-mono font-medium text-slate-400">COOKIE SESSION:</span>
              <span className={`font-semibold ${session?.loggedIn ? "text-emerald-400" : "text-red-405"}`}>
                {session?.loggedIn ? "BACKED UP" : "NOT FOUND"}
              </span>
            </div>

            {/* Status 2: Active target keywords */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg pl-2 pr-2.5 py-1.5" title="Keywords filter criteria count">
              <Settings2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono font-medium text-slate-400">KEYWORDS LIST:</span>
              <span className="font-bold text-slate-100">{config?.keywords?.length || 0} mục</span>
            </div>

            {/* Status 3: Current province location */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg pl-2 pr-2.5 py-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono font-medium text-slate-400">LOC:</span>
              <span className="font-semibold text-slate-100">{config?.location || "Chưa chọn"}</span>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container section: Sidebar Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6" id="vjaa-main-layout">
        
        {/* Left Side menu navigation */}
        <aside className="md:w-60 shrink-0" id="vjaa-navigation-aside">
          <nav className="space-y-1.5 sticky top-24 select-none">
            {[
              { id: "console", label: "Bảng Điều Khiển Console", subtitle: "Chạy bot & xem nhật ký Playwright", icon: TerminalIcon },
              { id: "jobs", label: "Tiến Trình Ứng Tuyển", subtitle: "Tuyển lọc JDs & Cover Letters", icon: Briefcase },
              { id: "profile", label: "Hồ Sơ Năng Lực CV", subtitle: "Chỉnh sửa master_profile.md", icon: FileText },
              { id: "config", label: "Cấu Hình Robot", subtitle: "Keywords & Cài đặt chống bot", icon: Settings2 }
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`side-nav-btn-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    // Reload states on switches to keep synced always
                    if (item.id === "jobs") {
                      fetchJobs();
                      fetchProfile();
                    } else if (item.id === "console") {
                      fetchSession();
                    }
                  }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                      : "bg-[#1E293B] text-slate-300 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <div className={`p-1.5 rounded-md mt-0.5 ${isSelected ? "bg-white/10" : "bg-slate-900 text-slate-400"}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-sans">{item.label}</h3>
                    <p className={`text-[10px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>{item.subtitle}</p>
                  </div>
                </button>
              );
            })}

            {/* Quick tips box */}
            <div className="mt-8 p-4 bg-[#1E293B] rounded-xl border border-slate-700 shadow-sm select-none">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider">Lưu Ý Vận Hành</h4>
              </div>
              <p className="text-[9.5px] text-slate-300 leading-relaxed mt-1.5 font-medium">
                Sử dụng API <strong className="font-mono text-emerald-400">gemini-3.5-flash</strong> chính thống từ Google. Hãy đảm bảo nạp đúng CV tại mục "Hồ Sơ Năng Lực" để sinh văn phong Cover Letter tối ưu chất lượng kỹ thuật nhất!
              </p>
            </div>
          </nav>
        </aside>

        {/* Right Active viewport wrapper */}
        <main className="flex-1 min-w-0" id="vjaa-active-pane">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "console" && (
                <ConsoleTab
                  session={session}
                  onRefreshSession={fetchSession}
                  onTriggerJobsReload={fetchJobs}
                  activeKeywords={config?.keywords || []}
                  activeLocation={config?.location || "Ho Chi Minh"}
                />
              )}

              {activeTab === "jobs" && (
                <JobsTab
                  jobs={jobs}
                  session={session}
                  masterProfile={masterProfile}
                  onRefreshJobs={fetchJobs}
                  onSaveToast={showToast}
                />
              )}

              {activeTab === "profile" && (
                <ProfileTab onSaveToast={showToast} />
              )}

              {activeTab === "config" && (
                <ConfigTab onSaveToast={showToast} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Global Interactive Notification Toast system */}
      <div className="fixed bottom-5 right-5 space-y-2.5 z-50 select-none" id="vjaa-toast-dock">
        <AnimatePresence>
          {toastList.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 25, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 25, scale: 0.95 }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-white text-xs font-semibold shadow-xl flex items-center gap-2.5 min-w-[280px]"
            >
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="flex-1 font-sans">{toast.message}</span>
              <button 
                onClick={() => setToastList((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Humble Footer section */}
      <footer className="bg-slate-900 border-t border-slate-800 py-5 select-none mt-auto" id="vjaa-global-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-slate-500 font-mono">
          <p>© 2026 VIETNAM JOB AUTOMATION AGENT SYSTEM. ALL RIGHTS RESERVED.</p>
          <p className="mt-2 sm:mt-0">STATION CONTROL ROOM PROUDLY CONNECTING WITH GEMINI CORES</p>
        </div>
      </footer>

    </div>
  );
}
