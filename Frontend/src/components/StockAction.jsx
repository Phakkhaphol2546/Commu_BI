import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Loader2,
  X,
  Tag,
  Layers,
  Edit2,
  ShoppingBag,
  ChevronDown,
  CheckSquare,
  XCircle,
  PackageX,
  Check,
  Lock,
  AlertTriangle
} from "lucide-react";

// --- ✨ Sub-Component: Smart & Compact Dropdown ---
const MultiSelectFilter = ({ title, options, selected, onChange, icon: Icon, subLabels = {}, disabled = false, align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => {
    if (selected.length === options.length) onChange([]);
    else onChange(options);
  };

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-10 flex items-center gap-2 px-3 rounded-xl text-xs font-bold transition-all border shadow-sm select-none whitespace-nowrap ${
          disabled 
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : selected.length > 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        {disabled ? <Lock size={14}/> : (Icon && <Icon size={16} />)}
        <span>{title}</span>
        
        {!disabled && selected.length > 0 && (
          <span className="flex items-center justify-center bg-indigo-600 text-white text-[9px] h-4 min-w-[16px] px-1 rounded-full">
            {selected.length}
          </span>
        )}
        
        {!disabled && <ChevronDown size={14} className={`ml-1 opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />}
      </button>

      {/* Dropdown Content */}
      {isOpen && !disabled && (
        <div 
            className={`absolute top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[220px] max-w-[280px]
            ${align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"}
            `}
        >
          
          {/* Header */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 space-y-2">
             <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                    type="text" 
                    placeholder="ค้นหา..."
                    className="w-full pl-9 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-0 bg-white outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                />
             </div>
             
             <div className="flex justify-between items-center px-0.5">
                <button 
                    onClick={selectAll} 
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors bg-indigo-50/50 px-2 py-1 rounded hover:bg-indigo-100"
                >
                    <CheckSquare size={12}/> {selected.length === options.length ? 'ล้าง' : 'เลือกทั้งหมด'}
                </button>
                
                {selected.length > 0 && (
                    <button 
                        onClick={() => onChange([])} 
                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                        <XCircle size={12}/> รีเซ็ต
                    </button>
                )}
             </div>
          </div>

          {/* List Options */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`flex items-start gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-all mb-0.5 group ${
                      selected.includes(option) 
                      ? "bg-indigo-50 text-indigo-900" 
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-all shadow-sm shrink-0 ${
                      selected.includes(option) 
                      ? "bg-indigo-600 border-indigo-600 scale-100" 
                      : "border-slate-300 bg-white group-hover:border-indigo-300"
                  }`}>
                    {selected.includes(option) && <Check size={10} className="text-white" />}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs truncate ${selected.includes(option) ? "font-bold" : "font-medium"}`}>
                        {option}
                    </span>
                    {subLabels[option] && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Tag size={10} className="opacity-50"/> {subLabels[option]}
                        </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[10px] text-slate-400 flex flex-col items-center gap-1 opacity-70">
                  <PackageX size={20}/>
                  <span>ไม่พบข้อมูล</span>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-1.5 text-[10px] text-center text-slate-400 border-t border-slate-100 font-medium">
              ทั้งหมด {filteredOptions.length} รายการ
          </div>
        </div>
      )}
    </div>
  );
};

export default function StockView({ onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
 const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";

  // State สำหรับกรองหมวดหมู่
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    let currentOrgId = "";
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) currentOrgId = JSON.parse(userStr).organization_id;
    } catch (e) {}

    fetch(`${API_BASE_URL}/api/products?org_id=${currentOrgId}`) 
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ดึงรายชื่อหมวดหมู่ทั้งหมดจากสินค้า
  const uniqueCategories = useMemo(() => {
    return [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  }, [products]);

  // Logic การกรอง (ค้นหา + หมวดหมู่)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.id).includes(searchTerm);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategories]);

  const selectedProduct = products.find((p) => p.id === selectedId);

  // ✅ แก้บั๊ก: ฟังก์ชันสถานะสต็อก รับแค่ 1 พารามิเตอร์คือ stock เท่านั้น
  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: "หมด", bg: "bg-rose-500", text: "text-rose-500", lightBg: "bg-rose-50" };
    if (stock < 30) return { label: "ใกล้หมด", bg: "bg-amber-500", text: "text-amber-600", lightBg: "bg-amber-50" };
    return { label: "มีของ", bg: "bg-emerald-500", text: "text-emerald-600", lightBg: "bg-emerald-50" };
  };

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="animate-spin text-indigo-500" size={36} />
        <span className="text-sm font-bold text-slate-400">
          กำลังโหลดข้อมูล...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      
      {/* -------------------- HEADER -------------------- */}
      <div className="bg-white px-4 pt-4 pb-2 shadow-sm z-10 flex flex-col gap-3">
        
        {/* Row 1: Title & Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition text-slate-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-lg font-black text-slate-800">คลังสินค้า</h1>
                <p className="text-xs text-slate-400">ภาพรวมสินค้าคงเหลือ</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100">
            {filteredProducts.length} รายการ
          </span>
        </div>

        {/* Row 2: Search & Filter */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium outline-none"
                    placeholder="ค้นหาสินค้า..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <MultiSelectFilter 
                title="หมวดหมู่" 
                icon={Layers}
                options={uniqueCategories} 
                selected={selectedCategories} 
                onChange={setSelectedCategories}
                align="right"
            />
        </div>
      </div>

      {/* -------------------- PRODUCT GRID -------------------- */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 custom-scrollbar">
        {filteredProducts.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((p) => {
              // ✅ ใช้ getStockStatus แบบส่งแค่จำนวนชิ้น (stock)
              const status = getStockStatus(p.stock);

              return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-transform overflow-hidden cursor-pointer group hover:shadow-md flex flex-col"
              >
                <div className="relative aspect-square bg-slate-50 flex items-center justify-center">
                  {p.image_url ? (
                      <img
                        src={p.image_url}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                        alt={p.name}
                        onError={(e) => e.target.src = "https://via.placeholder.com/400"}
                      />
                  ) : (
                      <ShoppingBag className="text-slate-200" size={40}/>
                  )}
                  
                  {/* ป้ายกำกับสถานะสต็อก */}
                  <span
                    className={`absolute top-2 right-2 text-[9px] px-2 py-1 rounded-md font-bold text-white shadow-sm flex items-center gap-1 ${status.bg}`}
                  >
                    {status.label === "ใกล้หมด" && <AlertTriangle size={10} />}
                    {status.label}
                  </span>
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <div className="mb-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Tag size={10}/> {p.category || "ไม่ระบุ"}
                      </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-700 line-clamp-1 mb-2 group-hover:text-indigo-600 transition-colors flex-1">
                    {p.name}
                  </h3>
                  <div className="flex items-end justify-between border-t border-slate-50 pt-2 mt-auto">
                    <span className="text-indigo-600 font-black text-base">
                      ฿{Number(p.price).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${status.lightBg} ${status.text}`}>
                      {p.stock} ชิ้น
                    </span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag size={40} className="text-slate-300" />
            </div>
            <p className="font-bold text-lg text-slate-500">ไม่พบสินค้า</p>
            <p className="text-sm text-slate-400">ลองเปลี่ยนคำค้นหาหรือตัวเลือกดูนะครับ</p>
          </div>
        )}
      </div>

      {/* -------------------- BOTTOM SHEET -------------------- */}
      {selectedProduct && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedId(null)}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[2rem] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1" onClick={() => setSelectedId(null)}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full cursor-pointer hover:bg-slate-300 transition-colors" />
            </div>

            {/* Header / Close */}
            <div className="flex justify-between items-center px-6 py-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">รายละเอียดสินค้า</span>
                <button
                    onClick={() => setSelectedId(null)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 pt-2 custom-scrollbar">
              {/* Product Header */}
              <div className="flex gap-5 mb-6 items-start">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0 bg-slate-50 relative">
                    <img
                    src={
                        selectedProduct.image_url ||
                        "https://via.placeholder.com/400"
                    }
                    className="w-full h-full object-cover"
                    alt=""
                    onError={(e) => e.target.src = "https://via.placeholder.com/400"}
                    />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md mb-2">
                    <Layers size={10}/> {selectedProduct.category || "สินค้าทั่วไป"}
                  </span>
                  <h2 className="text-xl font-black text-slate-800 leading-tight mb-1">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: {selectedProduct.id.toString().padStart(6, '0')}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                  <p className="text-xs font-bold text-indigo-400 mb-1">ราคาขาย</p>
                  <p className="text-2xl font-black text-indigo-600">
                    ฿{Number(selectedProduct.price).toLocaleString()}
                  </p>
                </div>
                
                {(() => {
                  // ✅ แก้บั๊ก: เรียกใช้ getStockStatus ด้วยพารามิเตอร์ตัวเดียว
                  const mainStatus = getStockStatus(selectedProduct.stock);
                  return (
                    <div className={`p-4 rounded-2xl text-center border ${mainStatus.label === "ใกล้หมด" ? "bg-amber-50 border-amber-100" : mainStatus.label === "หมด" ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
                      <p className={`text-xs font-bold mb-1 ${mainStatus.label === "มีของ" ? "text-slate-400" : mainStatus.text}`}>
                        คงเหลือ {mainStatus.label === "ใกล้หมด" && "(ใกล้หมด)"}
                      </p>
                      <p className={`text-2xl font-black ${mainStatus.text}`}>
                        {selectedProduct.stock} <span className="text-sm font-bold opacity-60">ชิ้น</span>
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Cost Info */}
              <div className="flex items-center justify-between p-4 border border-slate-100 bg-slate-50/50 rounded-2xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Tag size={18} />
                  </div>
                  <span className="font-bold text-slate-600 text-sm">ราคาทุนต่อชิ้น</span>
                </div>
                <span className="font-black text-blue-600 text-lg">
                  ฿{Number(selectedProduct.cost || 0).toLocaleString()}
                </span>
              </div>

              {/* Variants Section */}
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
                  <Layers size={16} className="text-slate-400" /> รายการย่อย (Variants)
                </h3>

                {selectedProduct.variants?.length ? (
                  <div className="space-y-2">
                    {selectedProduct.variants.map((v, i) => {
                      // ✅ แก้บั๊ก: เรียกใช้ getStockStatus ด้วยพารามิเตอร์ตัวเดียว
                      const vStatus = getStockStatus(v.stock);
                      return (
                        <div
                          key={i}
                          className="flex justify-between items-center p-3.5 bg-white border border-slate-100 rounded-xl hover:border-indigo-100 transition-colors shadow-sm"
                        >
                          <span className="font-bold text-slate-700 text-sm">{v.name}</span>
                          <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400">
                                  ฿{Number(v.price).toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-bold ${vStatus.text}`}>
                                  {v.stock} ชิ้น
                                </span>
                                {vStatus.label === "ใกล้หมด" && (
                                  <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                                    ใกล้หมด
                                  </span>
                                )}
                              </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 bg-slate-50/50">
                    <PackageX size={24} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-xs">ไม่มีรายการย่อย (Single Product)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="absolute bottom-0 w-full p-4 bg-white border-t border-slate-100 pb-safe">
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition shadow-lg shadow-slate-200">
                <Edit2 size={18} /> แก้ไขข้อมูลสินค้า
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}