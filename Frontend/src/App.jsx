import React, { useState, useEffect, useCallback } from "react";
import { Bell, Menu, UserCircle, LogOut, EyeOff } from "lucide-react";
import Swal from "sweetalert2";

// --- Import Components ---
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import ProductManagement from "./components/ProductManagement";
import AddProduct from "./components/AddProduct";
import StockMovement from "./components/StockMovement";
import StockView from "./components/StockView";
import SalesRecord from "./components/SalesRecord";
import SalesAction from "./components/SalesAction";
import ReportAnalytics from "./components/ReportAnalytics";
import GeneralLedger from "./components/GeneralLedger";
import ProductionCalculator from "./components/ProductionCalculator";
import AuthPage from "./components/AuthPage";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminViewing, setIsAdminViewing] = useState(false);

  const [ledgerEntries, setLedgerEntries] = useState(() => {
    const savedData = localStorage.getItem("myLedgerData");
    return savedData ? JSON.parse(savedData) : [];
  });

  // --- 1. ตรวจสอบสถานะ Login ---
  useEffect(() => {
    const savedUser = localStorage.getItem("otop_user");
    const originalAdmin = localStorage.getItem("original_admin");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (originalAdmin) {
      setIsAdminViewing(true);
    }
    setLoadingAuth(false);
  }, []);

  // --- 2. ระบบตรวจจับการไม่เคลื่อนไหว (Inactivity Timeout) ---
  useEffect(() => {
    if (!user) return; // ถ้ายังไม่ Login ไม่ต้องเริ่มนับ

    let timeoutId;

    const handleTimeout = () => {
      if (isAdminViewing) {
        // กรณีส่องชาวบ้านอยู่ -> ดีดกลับเป็น Admin
        const originalAdmin = localStorage.getItem("original_admin");
        Swal.fire({
          title: 'ไม่มีการใช้งาน (30 วินาที)',
          text: 'ระบบกำลังนำคุณกลับสู่โหมดผู้ดูแลระบบ...',
          icon: 'info',
          timer: 20000000,
          showConfirmButton: false
        }).then(() => {
          if (originalAdmin) {
            localStorage.setItem("otop_user", originalAdmin);
            localStorage.removeItem("original_admin");
          }
          window.location.reload();
        });
      } else {
        // กรณี User ปกติ -> Logout
        Swal.fire({
          title: 'หมดเวลาการใช้งาน',
          text: 'ไม่มีการเคลื่อนไหวเกิน 30 วินาที ระบบจะออกจากระบบเพื่อความปลอดภัย',
          icon: 'warning',
          timer: 2000000,
          showConfirmButton: false
        }).then(() => {
          setUser(null);
          localStorage.removeItem("otop_user");
          localStorage.removeItem("original_admin");
          setIsAdminViewing(false);
          window.location.reload();
        });
      }
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleTimeout, 7200000); 
    };

    // เหตุการณ์ที่จะนับหนึ่งใหม่ (ขยับเมาส์, คลิก, พิมพ์, เลื่อนจอ)
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((name) => window.addEventListener(name, resetTimer));

    resetTimer(); // เริ่มนับครั้งแรก

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((name) => window.removeEventListener(name, resetTimer));
    };
  }, [user, isAdminViewing]);

  // --- 3. Functions อื่นๆ ---
  useEffect(() => {
    localStorage.setItem("myLedgerData", JSON.stringify(ledgerEntries));
  }, [ledgerEntries]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("otop_user", JSON.stringify(userData));
    localStorage.removeItem("original_admin");
    setIsAdminViewing(false);
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        setUser(null);
        localStorage.removeItem("otop_user");
        localStorage.removeItem("original_admin");
        setIsAdminViewing(false);
        window.location.reload();
      }
    });
  };

  const handleAdminSwitchUser = (targetUser) => {
    Swal.fire({
      title: 'สลับบัญชี...',
      text: `เข้าสู่ระบบในนาม "${targetUser.username}"`,
      icon: 'success',
      timer: 1000,
      showConfirmButton: false
    }).then(() => {
      localStorage.setItem("original_admin", JSON.stringify(user));
      localStorage.setItem("otop_user", JSON.stringify(targetUser));
      window.location.reload();
    });
  };

  const handleExitAdminView = () => {
    const originalAdmin = localStorage.getItem("original_admin");
    if (originalAdmin) {
      localStorage.setItem("otop_user", originalAdmin);
      localStorage.removeItem("original_admin");
    }
    window.location.reload();
  };

  const handleRecordSale = (saleData) => {
    const newEntry = {
      date: new Date().toISOString().split("T")[0],
      description: saleData.description || `ขายสินค้า (${saleData.itemsCount || 0} รายการ)`,
      category: "รายรับ (ขายสินค้า)",
      ref: saleData.ref || `POS-${Date.now().toString().slice(-6)}`,
      debit: parseFloat(saleData.totalAmount) || 0,
      credit: 0,
      timestamp: Date.now(),
    };
    setLedgerEntries((prev) => [...prev, newEntry]);
  };

  const getPageTitle = () => {
    switch (activeMenu) {
      case "dashboard": return `ภาพรวมธุรกิจ ${user?.org_name || ""}`;
      case "products": return `จัดการสินค้า ${user?.org_name || ""}`;
      case "add-product": return `เพิ่มสินค้าใหม่ ${user?.org_name || ""}`;
      case "stock": return `สต็อกสินค้า ${user?.org_name || ""}`;
      case "stock-view": return `ตรวจสอบสต็อกสินค้า ${user?.org_name || ""} `;
      case "sales": return `ข้อมูลการขาย ${user?.org_name || ""}`;
      case "sale-action": return `จุดขายหน้าร้าน ${user?.org_name || ""}`;
      case "production": return `คำนวณต้นทุนการผลิต ${user?.org_name || ""} `;
      case "members": return `สมุดบัญชีแยกประเภท  ${user?.org_name || ""}`;
      case "reports": return `รายงานวิเคราะห์ ${user?.org_name || ""}`;
      case "admin_panel": return `จัดการระบบ ${user?.org_name || ""}`;
      default: return "OTOP Enterprise System";
    }
  };

  if (loadingAuth) return null;
  if (!user) return <AuthPage onLoginSuccess={handleLoginSuccess} />;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="flex bg-slate-100 text-slate-700 font-sans min-h-screen" style={{ fontFamily: "'Prompt', sans-serif" }}>

        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

          {isAdminViewing && (
            <div className="bg-orange-500 text-white px-4 py-2 flex justify-between items-center shadow-md z-30">
              <div className="flex items-center gap-2 text-sm font-bold animate-pulse">
                <EyeOff size={20} />
                <span>คุณกำลังดูข้อมูลในนาม: {user.org_name} ({user.username})</span>
              </div>
              <button onClick={handleExitAdminView} className="bg-white text-orange-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors">
                กลับสู่ Admin
              </button>
            </div>
          )}

          <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                <Menu size={24} />
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">{getPageTitle()}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isAdminViewing ? "bg-orange-500" : "bg-emerald-500"}`}></span>
                  ระบบออนไลน์ • {user.org_name || "สาขาสุราษฎร์ธานี"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 bg-slate-50 hover:bg-white border border-transparent rounded-full text-slate-500">
                <Bell size={20} />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              </button>

              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-700">{user.username || "User"}</p>
                  <p className="text-[10px] text-slate-400">{user.role || "สมาชิก"}</p>
                </div>
                <button onClick={handleLogout} className="group relative">
                  <UserCircle size={40} className="text-slate-300 group-hover:text-red-500" />
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-200 opacity-0 group-hover:opacity-100">
                    <LogOut size={12} className="text-red-500" />
                  </div>
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto">
              {activeMenu === "dashboard" && <DashboardHome />}
              {activeMenu === "products" && <ProductManagement onCreate={() => setActiveMenu("add-product")} />}
              {activeMenu === "add-product" && <AddProduct onBack={() => setActiveMenu("products")} />}
              {activeMenu === "stock" && <StockMovement onNavigate={(page) => setActiveMenu(page)} />}
              {activeMenu === "stock-view" && <StockView onBack={() => setActiveMenu("stock")} />}
              {activeMenu === "sales" && <SalesRecord onCreate={() => setActiveMenu("sale-action")} />}
              {activeMenu === "sale-action" && <SalesAction onBack={() => setActiveMenu("sales")} onRecordSale={handleRecordSale} />}
              {activeMenu === "production" && <ProductionCalculator />}
              {activeMenu === "members" && <GeneralLedger accountName="เงินสด" accountNumber="101" initialData={ledgerEntries} />}
              {activeMenu === "reports" && <ReportAnalytics />}
              {activeMenu === "admin_panel" && <AdminDashboard onSwitchUser={handleAdminSwitchUser} />}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}