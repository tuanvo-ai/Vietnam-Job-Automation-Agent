import React, { useState, useEffect } from "react";
import { Settings, Plus, X, Server, Check, Sliders, ShieldCheck, Loader2 } from "lucide-react";
import { VjaaConfig } from "../types";

interface ConfigTabProps {
  onSaveToast: (msg: string) => void;
}

export default function ConfigTab({ onSaveToast }: ConfigTabProps) {
  const [config, setConfig] = useState<VjaaConfig | null>(null);
  const [newKeyword, setNewKeyword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to load configuration");
      const data = await res.json();
      setConfig(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedConfig: VjaaConfig) => {
    try {
      setSaving(true);
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig)
      });
      if (!res.ok) throw new Error("Failed to save config data");
      setConfig(updatedConfig);
      onSaveToast("Đã lưu các cài đặt cấu hình định vị VJAA thành công!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (!config || !newKeyword.trim()) return;
    if (config.keywords.includes(newKeyword.trim())) {
      setNewKeyword("");
      return;
    }
    const updated = {
      ...config,
      keywords: [...config.keywords, newKeyword.trim()]
    };
    setConfig(updated);
    setNewKeyword("");
    handleSave(updated);
  };

  const removeKeyword = (kw: string) => {
    if (!config) return;
    const updated = {
      ...config,
      keywords: config.keywords.filter((k) => k !== kw)
    };
    setConfig(updated);
    handleSave(updated);
  };

  const togglePlatform = (p: keyof VjaaConfig["platforms"]) => {
    if (!config) return;
    const updated = {
      ...config,
      platforms: {
        ...config.platforms,
        [p]: !config.platforms[p]
      }
    };
    setConfig(updated);
    handleSave(updated);
  };

  const updateLocation = (loc: string) => {
    if (!config) return;
    const updated = {
      ...config,
      location: loc
    };
    setConfig(updated);
    handleSave(updated);
  };

  const updateAntiBotNum = (key: keyof VjaaConfig["antiBotConfig"], value: number | boolean) => {
    if (!config) return;
    const updated = {
      ...config,
      antiBotConfig: {
        ...config.antiBotConfig,
        [key]: value
      }
    };
    setConfig(updated);
    handleSave(updated);
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#1E293B] rounded-xl border border-slate-700 shadow-lg">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" id="loading-spinner-config" />
        <p className="text-slate-300 font-medium text-xs">Đang tải cấu hình tìm kiếm keywords.json...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="config-tab-root">
      {/* Column 1 & 2: Keywords and Targets */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Module A: Keywords Search Engine */}
        <div className="bg-[#1E293B] rounded-xl border border-slate-700 shadow-lg p-5 sm:p-6" id="keywords-module-card">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Từ khóa Tìm kiếm & Định vị (Keywords Setting)</h3>
              <p className="text-[11px] text-slate-400">Agent sẽ tự động điền danh từ kỹ thuật làm bộ lọc tìm kiếm trên sàn việc làm.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Địa điểm làm việc mục tiêu (Location)</label>
              <select
                id="select-location"
                value={config.location}
                onChange={(e) => updateLocation(e.target.value)}
                className="w-full text-xs text-slate-200 p-2.5 bg-slate-900 border border-slate-700 rounded-lg outline-hidden hover:border-slate-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="Ho Chi Minh" className="bg-slate-950">TP. Hồ Chí Minh (HCMC)</option>
                <option value="Ha Noi" className="bg-slate-950">Hà Nội (HN)</option>
                <option value="Dong Nai" className="bg-slate-950">Đồng Nai (DN)</option>
                <option value="Binh Duong" className="bg-slate-950">Bình Dương (BD)</option>
                <option value="Da Nang" className="bg-slate-950">Đà Nẵng (DN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Danh sách Từ khóa Chuyên nghiệp ({config.keywords.length})</label>
              
              {/* Keyword tags */}
              <div className="flex flex-wrap gap-2 p-3.5 border border-slate-700 bg-slate-900/50 rounded-lg min-h-[90px] content-start">
                {config.keywords.length === 0 ? (
                  <p className="text-xs text-slate-500 self-center mx-auto select-none">Vui lòng thêm ít nhất một từ khóa để tìm kiếm cơ hội.</p>
                ) : (
                  config.keywords.map((kw, idx) => (
                    <span 
                      key={idx}
                      id={`kw-tag-${idx}`} 
                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 animate-fade-in"
                    >
                      <span>{kw}</span>
                      <button 
                        onClick={() => removeKeyword(kw)}
                        className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Key form */}
              <div className="flex items-center gap-2 mt-2.5">
                <input
                  id="input-new-keyword"
                  type="text"
                  placeholder="Ví dụ: PLC Siemens, Automation Manager, Trưởng phòng Điện..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  className="flex-1 text-xs bg-slate-900 text-slate-200 p-2.5 border border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
                />
                <button
                  id="btn-add-keyword"
                  onClick={addKeyword}
                  className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
                  title="Thêm từ khóa"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Module B: Targeted Job Sites */}
        <div className="bg-[#1E293B] rounded-xl border border-slate-700 shadow-lg p-5 sm:p-6" id="platforms-module-card">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Server className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Nền tảng Tuyển dụng Mục tiêu (Target Portals)</h3>
              <p className="text-[11px] text-slate-400">Kích hoạt hoặc tạm ngưng các kênh cào tin và nộp đơn tự động qua Playwright.</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { id: "vietnamworks", label: "VietnamWorks.com", count: "Trang tuyển dụng FDI lớn nhất" },
              { id: "topcv", label: "TopCV.vn", count: "Mạng lưới công ty công nghệ đa ngành" },
              { id: "linkedin", label: "LinkedIn.com", count: "Mạng xã hội việc làm chuyên nghiệp toàn cầu" },
              { id: "careerbuilder", label: "CareerBuilder.vn (Mock)", count: "Doanh nghiệp đa quốc gia", disabled: true },
              { id: "itviec", label: "ITViec.com (Mock)", count: "Dành riêng cho ngành kỹ thuật phần mềm", disabled: true }
            ].map((p) => {
              const isActive = config.platforms[p.id as keyof VjaaConfig["platforms"]];
              return (
                <button
                  key={p.id}
                  id={`btn-toggle-platform-${p.id}`}
                  onClick={() => !p.disabled && togglePlatform(p.id as keyof VjaaConfig["platforms"])}
                  className={`flex items-start text-left gap-3 p-3.5 rounded-xl border transition-all ${
                    p.disabled 
                      ? "opacity-50 bg-slate-950/50 border-slate-800 cursor-not-allowed" 
                      : isActive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white ring-2 ring-emerald-500/10 cursor-pointer"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer"
                  }`}
                >
                  <div className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center border ${
                    isActive ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-700 bg-slate-950"
                  }`}>
                    {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{p.label}</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">{p.count}</p>
                    {p.disabled && (
                      <span className="inline-block text-[8px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded mt-1.5">
                        Sắp Khởi Chạy
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Column 3: Anti-Bot & Guard settings */}
      <div className="space-y-6">
        <div className="bg-[#1E293B] rounded-xl border border-slate-700 shadow-lg p-5 sm:p-6" id="antibot-module-card">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-700 mb-5">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Cấu hình Chống Quét Khóa (Anti-Bot Logic)</h3>
              <p className="text-[11px] text-slate-400">Các quy tắc điều phối hành vi giả lập giống cơ chế con người thao tác thật.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-400">Độ trễ tối thiểu (Min Delay)</label>
                <span className="text-xs font-mono font-bold bg-slate-900 text-slate-200 border border-slate-800 px-1.5 py-0.5 rounded">
                  {config.antiBotConfig.humanDelayMin} giây
                </span>
              </div>
              <input
                id="range-delay-min"
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={config.antiBotConfig.humanDelayMin}
                onChange={(e) => updateAntiBotNum("humanDelayMin", parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">Độ trễ chờ dập dìu tối thiểu trước mỗi cử chỉ chuyển hướng, lăn cuộn chuột.</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-400">Độ trễ tối đa (Max Delay)</label>
                <span className="text-xs font-mono font-bold bg-slate-900 text-slate-200 border border-slate-800 px-1.5 py-0.5 rounded">
                  {config.antiBotConfig.humanDelayMax} giây
                </span>
              </div>
              <input
                id="range-delay-max"
                type="range"
                min={5}
                max={15}
                step={0.5}
                value={config.antiBotConfig.humanDelayMax}
                onChange={(e) => updateAntiBotNum("humanDelayMax", parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-900 rounded"
              />
              <p className="text-[10px] text-slate-500 mt-1">Độ trễ tối đa ngẫu nhiên khi giả lập gõ chữ Cover Letter phím từng từ.</p>
            </div>

            <div className="pt-3 border-t border-slate-700 space-y-3.5">
              
              {/* Fake User-Agent Toggle */}
              <button
                id="btn-toggle-ua-spoofing"
                onClick={() => updateAntiBotNum("userAgentSpoofing", !config.antiBotConfig.userAgentSpoofing)}
                className="flex items-center justify-between w-full text-left cursor-pointer select-none"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">Giả lập Chrome thật (User-Agent)</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Tránh nhận diện trình duyệt ảo headless bởi WAF Cloudflare.</p>
                </div>
                <div className={`w-10 h-6.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                  config.antiBotConfig.userAgentSpoofing ? "bg-emerald-500" : "bg-slate-800"
                }`}>
                  <div className={`bg-white w-5.5 h-5.5 rounded-full shadow-xs transform transition-transform duration-200 ${
                    config.antiBotConfig.userAgentSpoofing ? "translate-x-3.5" : "translate-x-0"
                  }`} />
                </div>
              </button>

              {/* Semi-Autonomous Check */}
              <div
                id="btn-toggle-semi-auto-wrapper"
                className="flex items-center justify-between w-full text-left select-none opacity-90 border border-emerald-500/10 p-2.5 rounded-xl bg-emerald-500/5"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-medium text-white">Bán Tự động (Semi-Autonomous)</h4>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BẮT BUỘC</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Chỉ dừng tại cổng duyệt điền sẵn, đợi ứng viên kiểm duyệt thủ công và click nộp hàng thật.</p>
                </div>
                <div className="w-10 h-6.5 flex items-center rounded-full p-0.5 bg-emerald-500 cursor-not-allowed" title="Cố định Bán Tự động để đảm bảo an toàn tuyển dụng">
                  <div className="bg-white w-5.5 h-5.5 rounded-full shadow-xs transform translate-x-3.5 transition-transform duration-200" />
                </div>
              </div>

            </div>

            <div className="mt-4 p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-2.5 text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[11px] font-bold text-amber-200">Khuyến cáo bảo mật tài khoản</h5>
                <p className="text-[9px] text-amber-400/80 mt-0.5 leading-relaxed">Nên giữ cài đặt Bán Tự động (Semi-Autonomous) trong tuần đầu tiên chạy Agent để kiểm duyệt tính chính xác của thư giới thiệu trước khi bấm nộp.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Saving state status indicator */}
        <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${saving ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
            <span className="text-[11px] font-bold text-slate-300">
              {saving ? "Đang đồng bộ..." : "Đồng bộ đám mây hoạt bát"}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">YAML/JSON Config</span>
        </div>
      </div>
    </div>
  );
}
