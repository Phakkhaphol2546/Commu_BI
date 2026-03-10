import React, { useState } from "react";
import {
  Store, User, Lock, ArrowRight, Loader2, CheckCircle2,
  Building2, Sparkles, LogIn, UserPlus, AlertCircle, Info, ChevronRight
} from "lucide-react";

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    orgName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // --- ระบบ Custom Modal แจ้งเตือน ---
  const [customModal, setCustomModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "info",
    confirmText: "ตกลง",
    onConfirm: null,
  });

  const showAlert = (title, text, type = "info", confirmText = "ตกลง", onConfirmCallback = null) => {
    setCustomModal({
      isOpen: true,
      title,
      text,
      type,
      confirmText,
      onConfirm: onConfirmCallback,
    });
  };

  const closeAlert = () => {
    setCustomModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- ฟังก์ชันเข้าสู่ระบบ (Login) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(
          "เข้าสู่ระบบสำเร็จ!",
          "ยินดีต้อนรับกลับสู่ระบบวิสาหกิจ",
          "success",
          "เริ่มต้นใช้งาน",
          () => {
            closeAlert();
            onLoginSuccess(data);
          }
        );
      } else {
        showAlert(
          "เข้าสู่ระบบไม่สำเร็จ",
          data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
      showAlert(
        "เกิดข้อผิดพลาด",
        "ไม่สามารถเชื่อมต่อ Server ได้ กรุณาลองใหม่ภายหลัง",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // --- ฟังก์ชันลงทะเบียน (Register) ---
  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showAlert("รหัสผ่านไม่ตรงกัน", "กรุณาตรวจสอบรหัสผ่านอีกครั้ง", "warning");
      return;
    }

    if (!formData.orgName || !formData.username || !formData.password) {
      showAlert("ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "warning");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: formData.orgName,
          username: formData.username,
          password: formData.password,
          role: "User",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(
          "ลงทะเบียนสำเร็จ!",
          "สร้างกลุ่มวิสาหกิจเรียบร้อย กรุณาเข้าสู่ระบบ",
          "success",
          "ไปหน้าเข้าสู่ระบบ",
          () => {
            closeAlert();
            setIsLogin(true);
            setFormData({ ...formData, password: "", confirmPassword: "" });
          }
        );
      } else {
        showAlert(
          "ลงทะเบียนไม่สำเร็จ",
          data.message || "อาจมีชื่อผู้ใช้นี้ในระบบแล้ว",
          "error"
        );
      }
    } catch (error) {
      console.error("Network Error:", error);
      showAlert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อ Server ได้", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- การตั้งค่าธีมสีตามสถานะ ---
  const theme = isLogin
    ? {
        bgGradient: "from-[#059669] to-[#10b981]",
        accent: "#10b981",
        light: "#ecfdf5",
        ring: "focus-within:ring-[#10b981]/30 focus-within:border-[#10b981]",
      }
    : {
        bgGradient: "from-[#4f46e5] to-[#6366f1]",
        accent: "#6366f1",
        light: "#eef2ff",
        ring: "focus-within:ring-[#6366f1]/30 focus-within:border-[#6366f1]",
      };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 sm:p-4 bg-[#f1f5f9] font-sans relative overflow-hidden">
      
      {/* เอฟเฟกต์แสงฟุ้งพื้นหลัง */}
      <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 transition-all duration-1000 ${isLogin ? "bg-emerald-400" : "bg-indigo-400"}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 transition-all duration-1000 ${isLogin ? "bg-teal-300" : "bg-violet-400"}`} />

      {/* บัตรหลัก (Main Card) */}
      <div className="w-full h-screen sm:h-auto sm:max-w-[1000px] bg-white sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-y-auto sm:overflow-hidden flex flex-col md:flex-row z-10 border-none sm:border border-white/50 transition-all duration-500">
        
        {/* ฝั่งซ้าย: ส่วนแสดงแบรนด์และสลับโหมด */}
        <div className={`w-full md:w-[42%] p-10 md:p-12 text-white flex flex-col justify-between relative overflow-hidden transition-all duration-700 bg-gradient-to-br ${theme.bgGradient} shrink-0`}>
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/30 shadow-inner">
              <Store size={28} />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight animate-in fade-in slide-in-from-left-4 duration-700">
                {isLogin ? (
                  <>ระบบธุรกิจ<br />อัจฉริยะ สำหรับ<br />กลุ่มวิสาหกิจ</>
                ) : (
                  <>เริ่มต้นเส้นทาง<br />ใหม่ไปกับเรา</>
                )}
              </h1>
            </div>
          </div>

          <div className="relative z-10 mt-12 bg-black/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 shadow-inner animate-in fade-in zoom-in duration-500 delay-300">
            <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4">
              {isLogin ? "ยังไม่เป็นสมาชิก?" : "มีบัญชีอยู่แล้ว?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full py-4 rounded-2xl bg-white text-slate-800 font-black text-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3 group shadow-xl shadow-black/5"
            >
              {isLogin ? "ลงทะเบียนกลุ่มใหม่" : "เข้าสู่ระบบทันที"}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ไอคอนพื้นหลังขนาดใหญ่ */}
          <div className="absolute -bottom-10 -left-10 opacity-10 pointer-events-none transform rotate-12 hidden md:block">
             {isLogin ? <Building2 size={350} /> : <Sparkles size={350} />}
          </div>
        </div>

        {/* ฝั่งขวา: ส่วนของฟอร์ม (Form) */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="max-w-[380px] mx-auto w-full">
            <div className="text-center md:text-left mb-10">
              <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6 transition-colors duration-500 mx-auto md:mx-0 shadow-sm`} 
                   style={{ backgroundColor: theme.light, color: theme.accent }}>
                {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                {isLogin ? "เข้าสู่ระบบ" : "สร้างบัญชีใหม่"}
              </h2>
              <p className="text-slate-400 font-medium">กรุณากรอกข้อมูลเพื่อดำเนินการต่อ</p>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
              
              {!isLogin && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">ชื่อกลุ่มวิสาหกิจ</label>
                  <div className={`group flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 transition-all ${theme.ring}`}>
                    <Store size={20} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                      type="text" name="orgName" required placeholder="เช่น วิสาหกิจชุมชนบ้านดอน" 
                      className="w-full h-12 bg-transparent outline-none pl-3 text-[15px] font-semibold text-slate-700" 
                      value={formData.orgName} onChange={handleChange} 
                    />
                  </div>
                </div>
              )}

              <div className="animate-in slide-in-from-bottom-2 duration-400">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">ชื่อผู้ใช้งาน </label>
                <div className={`group flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 transition-all ${theme.ring}`}>
                  <User size={20} className="text-slate-400 transition-colors" />
                  <input 
                    type="text" name="username" required placeholder="Username" 
                    className="w-full h-12 bg-transparent outline-none pl-3 text-[15px] font-semibold text-slate-700" 
                    value={formData.username} onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="animate-in slide-in-from-bottom-2 duration-500">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">รหัสผ่าน</label>
                <div className={`group flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 transition-all ${theme.ring}`}>
                  <Lock size={20} className="text-slate-400 transition-colors" />
                  <input 
                    type="password" name="password" required placeholder="••••••••" 
                    className="w-full h-12 bg-transparent outline-none pl-3 text-[15px] font-semibold text-slate-700" 
                    value={formData.password} onChange={handleChange} 
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="animate-in slide-in-from-bottom-2 duration-600">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">ยืนยันรหัสผ่านอีกครั้ง</label>
                  <div className={`group flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 transition-all ${theme.ring}`}>
                    <CheckCircle2 size={20} className="text-slate-400 transition-colors" />
                    <input 
                      type="password" name="confirmPassword" required placeholder="••••••••" 
                      className="w-full h-12 bg-transparent outline-none pl-3 text-[15px] font-semibold text-slate-700" 
                      value={formData.confirmPassword} onChange={handleChange} 
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl text-white font-black text-base shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-8 hover:-translate-y-0.5 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                style={{ backgroundColor: theme.accent, boxShadow: `0 12px 30px -10px ${theme.accent}66` }}
              >
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "เข้าสู่ระบบ" : "ยืนยันการสมัคร")}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>
          </div>

          <div className="absolute bottom-6 right-8 text-slate-100 opacity-40 pointer-events-none hidden md:block">
            {isLogin ? <Building2 size={160} /> : <Sparkles size={160} />}
          </div>
        </div>
      </div>

      {/* --- ระบบ Modal แจ้งเตือนสุดหรู --- */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner`} 
                 style={{ backgroundColor: customModal.type === 'success' ? '#ecfdf5' : (customModal.type === 'error' ? '#fff1f2' : '#f0f9ff') }}>
              {customModal.type === 'success' && <CheckCircle2 size={42} className="text-emerald-500" />}
              {customModal.type === 'error' && <AlertCircle size={42} className="text-red-500" />}
              {customModal.type === 'warning' && <AlertCircle size={42} className="text-amber-500" />}
              {customModal.type === 'info' && <Info size={42} className="text-indigo-500" />}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{customModal.title}</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{customModal.text}</p>
            <button 
              onClick={() => customModal.onConfirm ? customModal.onConfirm() : closeAlert()}
              className="w-full py-4 text-sm font-black text-white rounded-2xl transition-all active:scale-95 shadow-lg"
              style={{ backgroundColor: customModal.type === 'error' ? '#ef4444' : (customModal.type === 'info' ? '#6366f1' : '#10b981') }}
            >
              {customModal.confirmText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}