import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Tag,
  Layers,
  Box,
  AlertCircle,
  Info
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

export default function ProductManagement({ onCreate }) {
  // --- State ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userRole, setUserRole] = useState("User");

const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";
  // State สำหรับแก้ไขสินค้า
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    category: "",
    category_id: "",
    price: "",
    cost: "",
    stock: "",
    unit: "",
    image_url: "",
  });

  const [currentOrgId, setCurrentOrgId] = useState(null);

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

  const showConfirm = (title, text, type = "warning", confirmText = "ตกลง", onConfirmCallback) => {
    setCustomModal({
      isOpen: true,
      title,
      text,
      type,
      showCancel: true,
      confirmText,
      cancelText: "ยกเลิก",
      onConfirm: onConfirmCallback,
    });
  };

  const closeAlert = () => {
    setCustomModal((prev) => ({ ...prev, isOpen: false }));
  };

  // ✅ 1. โหลดข้อมูล User & Products
  useEffect(() => {
    let orgId = "";
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        orgId = user.organization_id;
        setCurrentOrgId(user.organization_id);
        setUserRole(user.role || "User");
      }
    } catch (e) {
      console.error(e);
    }

    if (!orgId) {
      setLoading(false);
      return;
    }

    loadProducts(orgId);
  }, []);

  const loadProducts = (orgId) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/products?org_id=${orgId}`)
      .then((res) => res.json())
      .then((data) => {
        const processedData = data.map((p) => {
          let costStructure = {};
          try {
            costStructure =
              typeof p.cost_breakdown === "string"
                ? JSON.parse(p.cost_breakdown)
                : p.cost_breakdown || {};
          } catch (e) { }

          let variantsList = [];
          try {
            variantsList =
              typeof p.variants === "string"
                ? JSON.parse(p.variants)
                : p.variants || [];
          } catch (e) { }

          const totalStock =
            variantsList.length > 0
              ? variantsList.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
              : Number(p.stock) || 0;

          return {
            ...p,
            price: Number(p.price) || 0,
            cost: Number(p.cost) || 0,
            stock: totalStock,
            cost_structure: costStructure,
            variants: variantsList,
          };
        });
        setProducts(processedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  };

  // ✅ 2. เปิด Modal แก้ไข
  const openEditModal = (product) => {
    setEditFormData({
      id: product.id,
      name: product.name,
      category: product.category || "",
      category_id: product.category_id,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      unit: product.unit || "ชิ้น",
      image_url: product.image_url,
    });
    setIsEditing(true);
    setSelectedProduct(null);
  };

  // ✅ 3. บันทึกการแก้ไข
  const handleUpdateProduct = async () => {
    if (!currentOrgId)
      return showAlert("แจ้งเตือน", "กรุณา Login ใหม่", "warning");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/products/${editFormData.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editFormData,
            organization_id: currentOrgId,
          }),
        }
      );

      if (res.ok) {
        setIsEditing(false);
        showAlert("บันทึกสำเร็จ!", "แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว", "success");
        loadProducts(currentOrgId);
      } else {
        showAlert("เกิดข้อผิดพลาด", "บันทึกไม่สำเร็จ", "error");
      }
    } catch (error) {
      showAlert("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    }
  };

  // ✅ 4. ลบสินค้า
  const handleDeleteProduct = (id) => {
    showConfirm(
      "ยืนยันการลบ?",
      "คุณจะไม่สามารถกู้คืนสินค้านี้ได้!",
      "warning",
      "ลบเลย!",
      async () => {
        closeAlert();
        if (!currentOrgId) return;

        try {
          const res = await fetch(
            `${API_BASE_URL}/api/products/${id}?org_id=${currentOrgId}`,
            {
              method: "DELETE",
            }
          );

          if (res.ok) {
            showAlert("ลบเรียบร้อย!", "สินค้าถูกลบออกจากระบบแล้ว", "success");
            loadProducts(currentOrgId);
            setSelectedProduct(null);
          } else {
            showAlert("ลบไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง", "error");
          }
        } catch (error) {
          showAlert("Error", "เกิดข้อผิดพลาด", "error");
        }
      }
    );
  };

  // กรองสินค้าตามคำค้นหา
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category &&
        p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      String(p.id).includes(searchTerm),
  );

  const getCostChartData = (costStructure) =>
    [
      {
        name: "วัตถุดิบ",
        value: Number(costStructure?.material || 0),
        color: "#6366f1",
      },
      {
        name: "ค่าแรง",
        value: Number(costStructure?.labor || 0),
        color: "#f97316",
      },
      {
        name: "บรรจุภัณฑ์",
        value: Number(costStructure?.packaging || 0),
        color: "#3b82f6",
      },
      {
        name: "น้ำ/ไฟ",
        value: Number(costStructure?.utilities || 0),
        color: "#eab308",
      },
      {
        name: "อื่นๆ",
        value: Number(costStructure?.others || 0),
        color: "#ec4899",
      },
    ].filter((d) => d.value > 0);

  if (loading)
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <span className="text-sm font-medium animate-pulse">
          กำลังโหลดข้อมูลสินค้า...
        </span>
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans relative pb-20 md:pb-10">

      {/* 1. Dashboard Stats (เหลือแค่ 2 กล่อง ปรับ Layout เป็น 2 คอลัมน์) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl md:rounded-[2rem] p-6 text-white flex flex-col justify-between shadow-xl shadow-slate-200 group relative overflow-hidden min-h-[180px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              จัดการสินค้า
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium">
              Inventory System
            </p>
          </div>
          <button
            onClick={onCreate}
            className="mt-4 md:mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-sm md:text-base"
          >
            <Plus size={20} strokeWidth={2.5} /> เพิ่มสินค้าใหม่
          </button>
        </div>

        {/* กล่องแสดงสินค้าทั้งหมด */}
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group min-h-[180px]">
          <div>
            <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider">
              สินค้าทั้งหมด
            </p>
            <h2 className="text-3xl md:text-5xl font-black mt-2 text-blue-600">
              {products.length}
            </h2>
            <span className="text-sm md:text-base text-slate-400 font-medium">
              รายการ
            </span>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Package size={32} />
          </div>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="bg-white p-2 rounded-2xl md:rounded-[1.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2 items-center">
        <div className="relative flex-1 group w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search
              className="text-slate-400 group-focus-within:text-emerald-500 transition-colors"
              size={20}
            />
          </div>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า..."
            className="w-full pl-11 pr-4 h-10 md:h-12 bg-transparent border-none rounded-xl focus:ring-0 text-slate-700 placeholder:text-slate-400 font-medium text-sm md:text-base outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-2"></div>
        <button className="w-full md:w-auto h-10 px-5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-slate-100">
          <Filter size={16} /> ตัวกรอง
        </button>
      </div>

      {/* 3. Table */}
      <div className="flex-1 bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[400px]">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10 text-slate-500 text-xs font-extrabold uppercase tracking-wider">
              <tr className="border-b border-slate-100">
                <th className="py-4 pl-6 md:pl-8 w-[35%]">รายละเอียดสินค้า</th>
                <th className="py-4 px-4">หมวดหมู่</th>
                <th className="py-4 px-4">ราคาขาย</th>
                <th className="py-4 px-4">คงเหลือ</th>
                <th className="py-4 px-4 text-center">สถานะ</th>
                <th className="py-4 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="hover:bg-slate-50/80 cursor-pointer group transition-all duration-200"
                  >
                    <td className="py-4 pl-6 md:pl-8">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden shrink-0 group-hover:shadow-md transition-shadow">
                          <img
                            src={
                              p.image_url ||
                              "https://via.placeholder.com/150?text=No+Img"
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            alt=""
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/150";
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm md:text-base mb-0.5 group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              ID: {p.id}
                            </span>
                            {p.variants?.length > 0 && (
                              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Layers size={10} /> {p.variants.length} ขนาด
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-lg bg-white border border-slate-100 text-slate-600 font-bold text-[10px] md:text-xs shadow-sm whitespace-nowrap">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 text-sm md:text-base">
                        {p.price.toLocaleString()} บาท
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 md:w-28">
                        <div className="flex justify-between text-[10px] md:text-xs mb-1.5 font-bold text-slate-500">
                          <span>
                            {p.stock} {p.unit}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(p.stock, 100)}%` }}
                            className={`h-full rounded-full ${p.stock < 20 ? "bg-red-500 shadow-red-200" : "bg-emerald-500 shadow-emerald-200"} shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {p.stock > 20 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-[11px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap">
                          <CheckCircle2 size={12} /> พร้อมขาย
                        </span>
                      ) : p.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-[11px] font-bold bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-600/20 whitespace-nowrap">
                          <AlertTriangle size={12} /> ใกล้หมด
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-[11px] font-bold bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-500/10 whitespace-nowrap">
                          <X size={12} /> หมด
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2 opacity-100 md:opacity-40 group-hover:opacity-100 transition-all">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(p);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(p.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="py-20 md:py-32 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center">
                        <Package
                          size={32}
                          className="text-slate-200"
                        />
                      </div>
                      <p className="font-medium text-sm md:text-base">
                        ไม่พบสินค้าในระบบ
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal แก้ไขสินค้า */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Edit3 size={18} className="text-blue-500" /> แก้ไขข้อมูลสินค้า
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  ชื่อสินค้า
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:bg-white transition-colors outline-none"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    หมวดหมู่
                  </label>
                  <input
                    type="text"
                    disabled
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed outline-none"
                    value={editFormData.category}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    หน่วยนับ
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                    value={editFormData.unit}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, unit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-full">
                  <label className="block text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">
                    ราคาขาย (บาท)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-800 outline-none"
                    value={editFormData.price}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateProduct}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md"
              >
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal Detail (Responsive - No Add Variant) */}
      {selectedProduct && !isEditing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedProduct(null)}
          ></div>
          <div className="bg-white w-full md:max-w-5xl h-[90vh] md:max-h-[85vh] rounded-t-3xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full z-20 backdrop-blur-md transition-all"
            >
              <X size={20} />
            </button>

            {/* Left: Visual & Info */}
            <div className="w-full md:w-5/12 bg-slate-50 flex flex-col border-r border-slate-100 overflow-y-auto shrink-0">
              {/* Image & Title */}
              <div className="relative h-64 md:h-72 shrink-0 group">
                <img
                  src={
                    selectedProduct.image_url ||
                    "https://via.placeholder.com/400"
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 uppercase tracking-wider mb-2 inline-block">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight shadow-black drop-shadow-md">
                    {selectedProduct.name}
                  </h2>
                </div>
              </div>

              {/* Stats & Charts */}
              <div className="p-6 md:p-8 space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                      ราคาขาย
                    </p>
                    <p className="text-xl md:text-2xl font-black text-slate-800">
                      {selectedProduct.price.toLocaleString()} บาท
                    </p>
                  </div>
                  <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">
                      คงเหลือ
                    </p>
                    <p
                      className={`text-xl md:text-2xl font-black ${selectedProduct.stock < 20 ? "text-red-500" : "text-emerald-600"}`}
                    >
                      {selectedProduct.stock}{" "}
                      <span className="text-sm text-slate-400 font-normal">
                        {selectedProduct.unit}
                      </span>
                    </p>
                  </div>
                </div>
                {/* Chart */}
                {selectedProduct.cost > 0 && (
                  <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs md:text-sm uppercase tracking-wider">
                      <Tag size={16} className="text-emerald-500" />{" "}
                      โครงสร้างต้นทุน
                    </h3>
                    <div className="flex items-center h-28 md:h-32">
                      <ResponsiveContainer width="40%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCostChartData(
                              selectedProduct.cost_structure,
                            )}
                            innerRadius={25}
                            outerRadius={45}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="#6366f1" /> <Cell fill="#f97316" />{" "}
                            <Cell fill="#3b82f6" /> <Cell fill="#eab308" />{" "}
                            <Cell fill="#ec4899" />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 pl-4 text-xs space-y-1.5 md:space-y-2">
                        {getCostChartData(selectedProduct.cost_structure).map(
                          (i) => (
                            <div
                              key={i.name}
                              className="flex justify-between text-slate-500"
                            >
                              <span>
                                <span
                                  className="w-2 h-2 rounded-full inline-block mr-2"
                                  style={{ backgroundColor: i.color }}
                                ></span>
                                {i.name}
                              </span>
                              <span className="font-bold text-slate-800">
                                {i.value} บาท
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Variants List (View Only) */}
            <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
              <div className="p-6 md:p-8 pb-4 flex items-center justify-between border-b border-slate-50 bg-white z-10 sticky top-0">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Layers className="text-purple-500" /> รายการขนาดสินค้า
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 custom-scrollbar">
                {/* Variants List */}
                {selectedProduct.variants &&
                  selectedProduct.variants.length > 0 ? (
                  <div className="space-y-3 md:space-y-0 md:border md:border-slate-100 md:rounded-2xl md:overflow-hidden md:shadow-sm">
                    {/* Mobile Card */}
                    <div className="md:hidden space-y-3">
                      {selectedProduct.variants.map((v, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{v.name}</p>
                            <p className="text-xs text-emerald-600 font-bold mt-1">
                              ราคา: ฿{Number(v.price).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400">
                              ทุน: ฿{Number(v.cost).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${Number(v.stock) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                            >
                              สต็อก: {v.stock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold">
                        <tr>
                          <th className="p-4 pl-6">ชื่อขนาด</th>
                          <th className="p-4">ราคาขาย</th>
                          <th className="p-4">ราคาทุน</th>
                          <th className="p-4 text-right pr-6">สต็อก</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedProduct.variants.map((v, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 font-bold text-slate-700">
                              {v.name}
                            </td>
                            <td className="p-4 text-emerald-600 font-bold">
                              {Number(v.price).toLocaleString()} บาท
                            </td>
                            <td className="p-4 text-slate-400">
                              {Number(v.cost).toLocaleString()} บาท
                            </td>
                            <td className="p-4 text-right pr-6">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Number(v.stock) > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}
                              >
                                {v.stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    <Box size={32} className="text-slate-300 mb-2" />
                    <p className="text-slate-400 font-bold text-sm">
                      สินค้านี้ไม่มีหลายขนาด (Standard)
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 border-t border-slate-100 flex gap-3 bg-white pb-safe">
                <button
                  onClick={() => openEditModal(selectedProduct)}
                  className="flex-1 py-3 md:py-3.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Edit3 size={18} />{" "}
                  <span className="hidden md:inline">แก้ไขข้อมูลสินค้า</span>
                  <span className="md:hidden">แก้ไข</span>
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-3 md:py-3.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
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
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors w-full ${customModal.type === 'error' || customModal.type === 'warning'
                    ? 'bg-red-500 hover:bg-red-600'
                    : customModal.type === 'info'
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
    </div>
  );
}