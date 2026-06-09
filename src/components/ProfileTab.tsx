import React, { useState, useEffect } from "react";
import { FileText, Save, Edit, Eye, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ProfileTabProps {
  onSaveToast: (msg: string) => void;
}

export default function ProfileTab({ onSaveToast }: ProfileTabProps) {
  const [profileContent, setProfileContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempContent, setTempContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Failed to load profile data");
      const data = await res.json();
      setProfileContent(data.content || "");
      setTempContent(data.content || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempContent })
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setProfileContent(tempContent);
      setIsEditing(false);
      onSaveToast("Đã lưu Hồ sơ Năng lực (master_profile.md) thành công!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#1E293B] rounded-xl border border-slate-700 shadow-lg">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" id="loading-spinner-profile" />
        <p className="text-slate-300 font-medium text-xs">Đang tải hồ sơ năng lực master_profile.md...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-700 shadow-lg overflow-hidden" id="profile-container-card">
      {/* Tab Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Quản lý Hồ sơ Năng lực (Master Profile)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hồ sơ này sẽ được nạp trực tiếp làm bộ ngữ cảnh (Context) cho mô hình <span className="font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded text-[11px] font-semibold">gemini-3.5-flash</span> để phân tích độ phù hợp với JD của nhà tuyển dụng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                id="btn-preview-mode"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Xem trước</span>
              </button>
              <button
                id="btn-save-profile"
                disabled={saving}
                onClick={saveProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-550 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu thay đổi</span>
              </button>
            </>
          ) : (
            <button
              id="btn-edit-profile"
              onClick={() => {
                setTempContent(profileContent);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-500 text-xs font-semibold text-white shadow-xs cursor-pointer transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Chỉnh sửa hồ sơ</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border-b border-red-900/40 flex items-start gap-2.5 text-xs text-red-400">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Editor / Viewer area */}
      <div className="p-4 sm:p-6">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
              <span>Định dạng: Markdown (.md) | Sử dụng phím tắt thông thường để chỉnh sửa</span>
              <span className="text-emerald-400 font-semibold">● Chế độ chỉnh sửa đang hoạt động</span>
            </div>
            <textarea
              id="profile-markdown-textarea"
              rows={24}
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="w-full font-mono text-sm text-slate-200 p-4 border border-slate-700 bg-[#0F172A] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-y leading-relaxed outline-hidden"
              placeholder="Nhập thông tin hồ sơ của bạn bằng ngôn ngữ Markdown tại đây..."
            />
          </div>
        ) : (
          <div className="prose max-w-none prose-sm sm:prose-base prose-emerald">
            {profileContent ? (
              <div className="bg-slate-900/40 rounded-xl p-5 sm:p-7 border border-slate-800 divide-y divide-slate-800 space-y-6 text-slate-350">
                {profileContent.split("\n\n").map((block, idx) => {
                  if (block.startsWith("# ")) {
                    return (
                      <h1 key={idx} className="text-2xl font-bold text-white pt-2 pb-1" id={`p-h1-${idx}`}>
                        {block.replace("# ", "")}
                      </h1>
                    );
                  }
                  if (block.startsWith("## ")) {
                    return (
                      <h2 key={idx} className="text-lg font-bold text-slate-200 pt-4 pb-1" id={`p-h2-${idx}`}>
                        {block.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (block.startsWith("### ")) {
                    return (
                      <h3 key={idx} className="text-base font-semibold text-slate-300 pt-3" id={`p-h3-${idx}`}>
                        {block.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (block.startsWith("- ") || block.startsWith("* ")) {
                    return (
                      <ul key={idx} className="list-disc list-inside pl-4 space-y-1.5 text-slate-300 text-sm">
                        {block.split("\n").map((li, lIdx) => (
                          <li key={lIdx} className="text-slate-300">
                            {li.replace(/^[\-\*]\s+/, "")}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                      {block}
                    </p>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl select-none">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-400">Hồ sơ năng lực đang trống</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Click 'Chỉnh sửa hồ sơ' phía trên để soạn thảo master profile và cung cấp ngữ cảnh phân tích cho Gemini.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
