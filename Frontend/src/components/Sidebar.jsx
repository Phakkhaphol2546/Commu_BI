import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  FileText,
  Users,
  X,
  Store,
  LogOut,
  ShieldCheck, // ไอคอนสำหรับ Admin
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle
} from "lucide-react";

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const [userRole, setUserRole] = useState("");

  // ✅ Custom Alert Modal State แทน SweetAlert2
  const [customModal, setCustomModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "info",
    showCancel: false,
    confirmText: "ตกลง",
    cancelText: "ยกเลิก",
    onConfirm: null,
  });

  const closeAlert = () => {
    setCustomModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ✅ 1. เช็ค Role เมื่อโหลดหน้า
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // เก็บ Role ไว้ตรวจสอบ (เช่น 'Admin', 'User', 'SuperAdmin')
        setUserRole(user.role || ""); 
      }
    } catch (e) {
      console.error("Error reading user role:", e);
    }
  }, []);

  const menuItems = [
    { id: "dashboard", label: "ภาพรวม", icon: <LayoutDashboard size={20} /> },
    { id: "products", label: "ผลิตสินค้า", icon: <Package size={20} /> },
    { id: "stock", label: "สต็อกสินค้า", icon: <Store size={20} /> },
    { id: "sales", label: "บันทึกการขาย", icon: <BarChart3 size={20} /> },
    { id: "members", label: "บัญชีแยกประเภท", icon: <Users size={20} /> },
    { id: "reports", label: "รายงาน", icon: <FileText size={20} /> },
  ];

  // ✅ 2. เพิ่มเมนู Admin ถ้า userRole เป็น 'SuperAdmin' (หรือ 'Admin' ตามที่คุณตั้ง)
  // ปรับเงื่อนไขนี้ให้ตรงกับ Database ของคุณนะครับ
  if (userRole === "SuperAdmin" || userRole === "Admin") {
      menuItems.push({ 
          id: "admin_panel", 
          label: "ผู้ดูแลระบบ", 
          icon: <ShieldCheck size={20} className="text-indigo-500" /> // ใส่สีให้เด่น
      });
  }

  const handleLogout = () => {
    setCustomModal({
      isOpen: true,
      title: 'ยืนยันการออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      type: 'warning',
      showCancel: true,
      confirmText: 'ใช่, ออกจากระบบ',
      cancelText: 'ยกเลิก',
      onConfirm: () => {
        // แสดง Modal สำเร็จ
        setCustomModal({
          isOpen: true,
          title: 'ออกจากระบบสำเร็จ!',
          text: 'กำลังนำคุณกลับสู่หน้าเข้าสู่ระบบ...',
          type: 'success',
          showCancel: false,
          confirmText: 'ตกลง',
          onConfirm: () => {
            localStorage.removeItem("otop_user");
            window.location.reload();
          }
        });

        // หน่วงเวลาปิดอัตโนมัติแบบเดียวกับ Timer
        setTimeout(() => {
          localStorage.removeItem("otop_user");
          window.location.reload();
        }, 1500);
      }
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col shadow-2xl md:shadow-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center justify-between px-8 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10">
              <Store size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">
                ระบบธุรกิจอัจฉริระ สำหรับกลุ่มวิสาหกิจชุมชน
              </h1>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            เมนูหลัก
          </p>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                activeMenu === item.id
                  ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {activeMenu === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full" />
              )}
              <span
                className={`transition-transform duration-200 ${
                  activeMenu === item.id
                    ? "scale-110 text-emerald-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* --- Custom Alert Modal --- */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
            
            <div className="flex justify-center mb-4">
              {customModal.type === 'success' && <CheckCircle2 size={48} className="text-emerald-500" />}
              {customModal.type === 'error' && <AlertCircle size={48} className="text-red-500" />}
              {customModal.type === 'warning' && <AlertCircle size={48} className="text-amber-500" />}
              {customModal.type === 'info' && <Info size={48} className="text-indigo-500" />}
              {customModal.type === 'question' && <HelpCircle size={48} className="text-indigo-500" />}
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">{customModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{customModal.text}</p>
            
            <div className="flex justify-center gap-3">
              {customModal.showCancel && (
                <button 
                  onClick={closeAlert}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors w-full"
                >
                  {customModal.cancelText}
                </button>
              )}
              <button 
                onClick={() => {
                  if (customModal.onConfirm) {
                    customModal.onConfirm();
                  } else {
                    closeAlert();
                  }
                }}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors w-full ${
                  customModal.type === 'error' || customModal.type === 'warning' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : customModal.type === 'info' || customModal.type === 'question'
                      ? 'bg-indigo-500 hover:bg-indigo-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {customModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}