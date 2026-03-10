import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  ShoppingBag,
  Plus,
  Loader2,
  Receipt,
  Calendar,
  User,
  Monitor,
  Store,
  Smartphone,
  X,
  Box,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

export default function SalesRecord({ onCreate }) {
  const [salesData, setSalesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [isXlsxReady, setIsXlsxReady] = useState(false);

const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";

  // ✅ State สำหรับ Modal รายละเอียด
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [orderItems, setOrderItems] = useState([]); 
  const [loadingItems, setLoadingItems] = useState(false); 

  // ✅ Custom Alert Modal State
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

  const showAlert = (title, text, type = "info") => {
    setCustomModal({
      isOpen: true,
      title,
      text,
      type,
      showCancel: false,
      confirmText: "ตกลง",
      onConfirm: null,
    });
  };

  const closeAlert = () => {
    setCustomModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ✅ โหลด XLSX Library ผ่าน CDN
  useEffect(() => {
    if (window.XLSX) {
      setIsXlsxReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setIsXlsxReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    let orgId = "";
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        orgId = user.organization_id;
        setOrgName(user.org_name || "");
      }
    } catch (e) {
      console.error(e);
    }

    if (!orgId) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/orders?org_id=${orgId}`)
      .then((res) => res.json())
      .then((data) => {
        setSalesData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, []);

  const filteredData = useMemo(() => {
    return salesData
      .filter(
        (item) =>
          (String(item.id).includes(searchTerm) ||
            (item.customer_name &&
              item.customer_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))) &&
          (item.payment_method === "Cash" || item.payment_method === "เงินสด")
      )
      .sort((a, b) => b.id - a.id);
  }, [salesData, searchTerm]);

  const totalRevenue = filteredData.reduce(
    (sum, item) => sum + Number(item.total_amount),
    0
  );

  // ✅ ฟังก์ชัน Export Excel (ปรับปรุง: เอาชื่อลูกค้าและช่องทางออก)
  const handleExportExcel = () => {
    if (!isXlsxReady || !window.XLSX) {
      return showAlert("ระบบยังไม่พร้อม", "กำลังโหลดส่วนประกอบสำหรับการส่งออกไฟล์ กรุณาลองใหม่ในอีกสักครู่", "warning");
    }

    if (filteredData.length === 0) {
      return showAlert("ไม่พบข้อมูล", "ไม่มีรายการขายสำหรับส่งออก", "info");
    }

    const timestamp = new Date().toLocaleString("th-TH");
    
    // 1. หัวรายงาน
    const reportHeader = [
      ["รายงานบันทึกการขาย (เงินสด)"],
      [`กลุ่มวิสาหกิจ: ${orgName}`],
      [`วันที่พิมพ์รายงาน: ${timestamp}`],
      [`จำนวนรายการทั้งหมด: ${filteredData.length} รายการ`],
      [`ยอดขายรวมสุทธิ: ${totalRevenue.toLocaleString()} บาท`],
      [], // แถวว่าง
      ["เลขที่บิล", "วันที่", "เวลา", "ยอดสุทธิ (บาท)"] // หัวตาราง (ตัดชื่อลูกค้าและช่องทางออก)
    ];

    // 2. ข้อมูลตาราง (ตัดชื่อลูกค้าและช่องทางออก)
    const reportRows = filteredData.map(item => [
      `#${item.id}`,
      new Date(item.order_date).toLocaleDateString("th-TH"),
      new Date(item.order_date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      Number(item.total_amount)
    ]);

    const finalContent = [...reportHeader, ...reportRows];

    // 3. สร้างไฟล์
    const XLSX_LIB = window.XLSX;
    const wb = XLSX_LIB.utils.book_new();
    const ws = XLSX_LIB.utils.aoa_to_sheet(finalContent);

    // ปรับความกว้างคอลัมน์ให้เหมาะสมกับจำนวนคอลัมน์ใหม่
    ws["!cols"] = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }
    ];

    XLSX_LIB.utils.book_append_sheet(wb, ws, "Sales_Record");
    XLSX_LIB.writeFile(wb, `รายงานการขาย_${orgName}.xlsx`);
  };

  const handleRowClick = async (order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}/items`);
      const data = await res.json();
      setOrderItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setOrderItems([]);
  };

  if (loading)
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p>กำลังโหลดข้อมูลการขาย...</p>
      </div>
    );

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans pb-10 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Receipt size={28} />
            </span>
            บันทึกการขาย
          </h1>
          <p className="text-slate-500 text-sm mt-2 ml-1 font-medium uppercase tracking-wider">
            วิสาหกิจ: {orgName}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 font-bold transition-all active:scale-95"
          >
            <FileSpreadsheet size={20} /> Export Excel
          </button>
          <button
            onClick={onCreate}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold transition-all active:scale-95"
          >
            <Plus size={20} /> เปิดบิลใหม่
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform"></div>
          <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-2">
            ยอดขายเงินสดรวม
          </p>
          <h2 className="text-5xl font-black tracking-tight flex items-baseline gap-2">
            {totalRevenue.toLocaleString()}{" "}
            <span className="text-2xl font-medium opacity-80">บาท</span>
          </h2>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-center">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">
            จำนวนบิลเงินสด
          </p>
          <h2 className="text-4xl font-black text-slate-800">
            {filteredData.length}{" "}
            <span className="text-lg text-slate-400 font-medium">รายการ</span>
          </h2>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-center hover:border-emerald-200 transition-colors">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">
            เฉลี่ยต่อบิล
          </p>
          <h2 className="text-4xl font-black text-emerald-600">
            {filteredData.length > 0
              ? (totalRevenue / filteredData.length).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })
              : 0}{" "}
            <span className="text-lg text-slate-400 font-medium text-black">
              บาท
            </span>
          </h2>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="ค้นหาเลขที่บิล, ชื่อลูกค้า..."
            className="w-full pl-12 pr-4 h-12 bg-transparent border-none rounded-xl focus:ring-0 text-slate-700 placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
        <button className="hidden md:flex h-10 px-6 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm items-center gap-2 border border-slate-100 transition-colors">
          <Filter size={16} /> ตัวกรอง
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-extrabold uppercase tracking-wider">
              <tr>
                <th className="p-5 pl-8">เลขที่บิล</th>
                <th className="p-5">วันที่ & เวลา</th>
                <th className="p-5">ลูกค้า</th>
                <th className="p-5 text-center">ช่องทาง</th>
                <th className="p-5 pr-8 text-right">ยอดสุทธิ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm font-medium">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer" 
                  >
                    <td className="p-5 pl-8">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        #{item.id}
                      </span>
                    </td>
                    <td className="p-5 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(item.order_date).toLocaleDateString("th-TH")}
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 rounded">
                          {new Date(item.order_date).toLocaleTimeString(
                            "th-TH",
                            { hour: "2-digit", minute: "2-digit" }
                          )} น.
                        </span>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-slate-700">
                        {item.customer_name || "ลูกค้าทั่วไป"}
                    </td>
                    <td className="p-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold shadow-sm">
                        {item.channel === "Online" ? <Monitor size={12} /> : item.channel === "Store" ? <Store size={12} /> : <Smartphone size={12} />}
                        {item.channel || "หน้าร้าน"}
                      </span>
                    </td>
                    <td className="p-5 pr-8 text-right">
                      <span className="text-lg font-black text-slate-800">
                        {Number(item.total_amount).toLocaleString()} บาท
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                    <ShoppingBag size={48} className="opacity-10" />
                    <p>ไม่พบรายการขายในขณะนี้</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal Detail */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <Receipt size={24} className="text-indigo-600" />
                <h3 className="font-black text-xl text-slate-800">บิล #{selectedOrder.id}</h3>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loadingItems ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-sm">
                    <div><p className="text-indigo-400 text-[10px] font-bold uppercase mb-1">วิสาหกิจ</p><p className="font-bold text-indigo-900">{orgName}</p></div>
                    <div className="text-right"><p className="text-indigo-400 text-[10px] font-bold uppercase mb-1">ช่องทาง</p><p className="font-bold text-indigo-900">{selectedOrder.channel}</p></div>
                  </div>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr><th className="p-4 text-left">สินค้า</th><th className="p-4 text-center">จำนวน</th><th className="p-4 text-right">รวม</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {orderItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-4"><p className="font-bold text-slate-700">{item.product_name}</p></td>
                            <td className="p-4 text-center text-slate-600">{item.quantity} {item.unit || "ชิ้น"}</td>
                            <td className="p-4 text-right font-bold text-slate-800">{(item.quantity * item.unit_price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-xs">ยอดสุทธิ</span>
              <span className="text-3xl font-black text-indigo-600">{Number(selectedOrder.total_amount).toLocaleString()} บาท</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom Alert Modal --- */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-center mb-4">
              {customModal.type === 'success' && <CheckCircle2 size={48} className="text-emerald-500" />}
              {customModal.type === 'error' && <AlertCircle size={48} className="text-red-500" />}
              {customModal.type === 'warning' && <AlertCircle size={48} className="text-amber-500" />}
              {customModal.type === 'info' && <Info size={48} className="text-indigo-500" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{customModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{customModal.text}</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { if (customModal.onConfirm) customModal.onConfirm(); else closeAlert(); }} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors w-full ${customModal.type === 'error' || customModal.type === 'warning' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}>{customModal.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}