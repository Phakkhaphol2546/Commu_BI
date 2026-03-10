import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  PackageSearch,
  ArrowRightLeft,
  Calendar,
  FileText,
  Layers,
  Loader2,
  PackageX,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  ChevronDown,
  Check,
  XCircle,
  CheckSquare,
  Tag,
  Lock,
  Package
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
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-9 flex items-center gap-2 px-3 rounded-lg text-xs font-bold transition-all border shadow-sm select-none whitespace-nowrap ${
          disabled 
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : selected.length > 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
        }`}
      >
        {disabled ? <Lock size={12}/> : (Icon && <Icon size={14} />)}
        <span>{title}</span>
        
        {!disabled && selected.length > 0 && (
          <span className="flex items-center justify-center bg-indigo-600 text-white text-[9px] h-4 min-w-[16px] px-1 rounded-full">
            {selected.length}
          </span>
        )}
        
        {!disabled && <ChevronDown size={12} className={`ml-1 opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />}
      </button>

      {isOpen && !disabled && (
        <div 
            className={`absolute top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px] max-w-[280px]
            ${align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"}
            `}
        >
          <div className="p-2 bg-slate-50 border-b border-slate-100 space-y-2">
             <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                    type="text" 
                    placeholder="ค้นหา..."
                    className="w-full pl-8 pr-2 py-1.5 text-[11px] rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-0 bg-white"
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
                    <CheckSquare size={10}/> {selected.length === options.length ? 'ล้าง' : 'เลือกทั้งหมด'}
                </button>
                
                {selected.length > 0 && (
                    <button 
                        onClick={() => onChange([])} 
                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                        <XCircle size={10}/> รีเซ็ต
                    </button>
                )}
             </div>
          </div>

          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={`flex items-start gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all mb-0.5 group ${
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
                            <Tag size={8} className="opacity-50"/> {subLabels[option]}
                        </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[10px] text-slate-400 flex flex-col items-center gap-1 opacity-70">
                  <PackageX size={16}/>
                  <span>ไม่พบข้อมูล</span>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-1.5 text-[9px] text-center text-slate-400 border-t border-slate-100 font-medium">
              ทั้งหมด {filteredOptions.length} รายการ
          </div>
        </div>
      )}
    </div>
  );
};

export default function StockMovement({ onNavigate }) {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";

  // ✅ Helper: เช็คว่าเป็นรายการรับเข้าหรือไม่?
  const isIncoming = (type) => {
      return type === 'IN' || type === 'RESTOCK' || type === ''; 
  };

  useEffect(() => {
    let orgId = "";
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) orgId = JSON.parse(userStr).organization_id;
    } catch (e) { console.error(e); }

    if(!orgId) { setLoading(false); return; }

    // ✅ เปลี่ยนไปใช้ API_BASE_URL
    Promise.all([
        fetch(`${API_BASE_URL}/api/stock-logs?org_id=${orgId}`),
        fetch(`${API_BASE_URL}/api/products?org_id=${orgId}`)
    ])
      .then(async ([logsRes, prodsRes]) => {
        const logsData = await logsRes.json();
        const prodsData = await prodsRes.json();
        setMovements(logsData);
        setProducts(prodsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setSelectedProducts([]);
  }, [selectedCategories]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(movements.map(m => m.category_name).filter(Boolean))].sort();
  }, [movements]);

  const availableProducts = useMemo(() => {
    if (selectedCategories.length === 0) return []; 
    const filteredByCat = movements.filter(m => selectedCategories.includes(m.category_name));
    return [...new Set(filteredByCat.map(m => m.product_name).filter(Boolean))].sort();
  }, [movements, selectedCategories]);

  const productCategoryMap = useMemo(() => {
      const map = {};
      movements.forEach(m => {
          if(m.product_name) map[m.product_name] = m.category_name || "ไม่ระบุ";
      });
      return map;
  }, [movements]);

  // ✅ Main Filter Logic
  const filteredData = useMemo(() => {
    return movements.filter((item) => {
        const matchesSearch = 
            item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.note?.toLowerCase().includes(searchTerm.toLowerCase()); 
        
        let matchesType = true;
        if (filterType === 'IN') matchesType = isIncoming(item.type);
        else if (filterType === 'OUT') matchesType = !isIncoming(item.type); 

        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category_name);
        const matchesProduct = selectedProducts.length === 0 || selectedProducts.includes(item.product_name);

        return matchesSearch && matchesType && matchesCategory && matchesProduct;
    });
  }, [movements, searchTerm, filterType, selectedCategories, selectedProducts]);

  const currentStockFromDB = useMemo(() => {
      const filteredProds = products.filter(p => {
          const matchCat = selectedCategories.length === 0 || selectedCategories.includes(p.category);
          const matchName = selectedProducts.length === 0 || selectedProducts.includes(p.name);
          return matchCat && matchName;
      });

      return filteredProds.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  }, [products, selectedCategories, selectedProducts]);

  // ✅ คำนวณ Stats (รับเข้า/เบิกออก)
  const stats = useMemo(() => {
    return filteredData.reduce((acc, item) => {
        const qty = Number(item.quantity);
        if (isIncoming(item.type)) acc.totalIn += qty;
        else acc.totalOut += qty;
        return acc;
    }, { totalIn: 0, totalOut: 0 });
  }, [filteredData]);

  return (
    <div className="w-full h-full flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans pb-20 md:pb-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowRightLeft size={24} className="md:w-8 md:h-8" />
            </div>
            ความเคลื่อนไหว
          </h1>
          <p className="text-slate-500 mt-1 pl-1 text-sm md:text-base">
            ตรวจสอบประวัติการไหลเวียนของสินค้า
          </p>
        </div>
        <button
            onClick={() => onNavigate("stock-view")}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
        >
            <PackageSearch size={20} /> ดูสต็อกคงเหลือ
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-indigo-50 p-4 md:p-5 rounded-2xl border border-indigo-100 flex items-center justify-between transition-all duration-300 order-first md:order-none">
            <div>
                <p className="text-indigo-600 text-[10px] md:text-xs font-bold uppercase mb-1">ยอดคงเหลือ (ในคลัง)</p>
                <h3 className="text-xl md:text-3xl font-black text-indigo-700">{currentStockFromDB.toLocaleString()}</h3>
            </div>
            <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm text-indigo-500">
                <Package size={20} className="md:w-7 md:h-7"/>
            </div>
        </div>

        <div className="bg-emerald-50 p-4 md:p-5 rounded-2xl border border-emerald-100 flex items-center justify-between transition-all duration-300">
            <div>
                <p className="text-emerald-600 text-[10px] md:text-xs font-bold uppercase mb-1">ยอดรับเข้าสะสม</p>
                <h3 className="text-xl md:text-3xl font-black text-emerald-700">+{stats.totalIn.toLocaleString()}</h3>
            </div>
            <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm text-emerald-500">
                <ArrowDownCircle size={20} className="md:w-7 md:h-7"/>
            </div>
        </div>

        <div className="bg-rose-50 p-4 md:p-5 rounded-2xl border border-rose-100 flex items-center justify-between transition-all duration-300">
            <div>
                <p className="text-rose-600 text-[10px] md:text-xs font-bold uppercase mb-1">ยอดเบิกออก (ช่วงนี้)</p>
                <h3 className="text-xl md:text-3xl font-black text-rose-700">-{stats.totalOut.toLocaleString()}</h3>
            </div>
            <div className="p-2 md:p-3 bg-white rounded-xl shadow-sm text-rose-500">
                <ArrowUpCircle size={20} className="md:w-7 md:h-7"/>
            </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2 md:p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 z-20 relative">
        <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="ค้นหา..."
                    className="w-full pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-xl focus:ring-0 focus:border-indigo-500 text-slate-700 font-medium text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
            
            <div className="flex gap-2 flex-wrap">
                <MultiSelectFilter 
                    title="หมวดหมู่" 
                    icon={Layers}
                    options={uniqueCategories} 
                    selected={selectedCategories} 
                    onChange={setSelectedCategories} 
                />

                <MultiSelectFilter 
                    title={selectedCategories.length === 0 ? "เลือกหมวดหมู่ก่อน" : "เลือกสินค้า"} 
                    icon={PackageSearch}
                    options={availableProducts}
                    selected={selectedProducts} 
                    onChange={setSelectedProducts}
                    subLabels={productCategoryMap}
                    disabled={selectedCategories.length === 0}
                    align="right"
                />
            </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
            {['ALL', 'IN', 'OUT'].map(type => (
                <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${filterType === type ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    {type === 'ALL' && <Filter size={12}/>}
                    {type === 'IN' && <ArrowDownCircle size={12}/>}
                    {type === 'OUT' && <ArrowUpCircle size={12}/>}
                    {type === 'ALL' ? 'ทั้งหมด' : type === 'IN' ? 'รับเข้า' : 'เบิกออก'}
                </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-transparent md:bg-white md:rounded-[2rem] md:border md:border-slate-200 md:shadow-sm md:overflow-hidden flex-1 flex flex-col z-10 relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 gap-2 py-20">
            <Loader2 className="animate-spin" /> กำลังโหลดข้อมูล...
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 pl-8 w-[180px]">วัน-เวลา</th>
                    <th className="py-4 px-4">สินค้า</th>
                    <th className="py-4 px-4">หมวดหมู่</th>
                    <th className="py-4 px-4 text-center">รายการ</th>
                    <th className="py-4 px-4 text-right">จำนวน</th>
                    <th className="py-4 px-4">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 pl-8 text-slate-500">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(item.transaction_date).toLocaleDateString("th-TH")}
                            </span>
                            <span className="text-xs pl-6 opacity-70">
                              {new Date(item.transaction_date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              <img
                                src={item.image_url || "https://via.placeholder.com/100?text=IMG"}
                                className="w-full h-full object-cover"
                                onError={(e) => (e.target.src = "https://via.placeholder.com/100?text=Error")}
                                alt=""
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{item.product_name}</p>
                              {item.variant_name && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 mt-1">
                                  <Layers size={10} /> {item.variant_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">
                                {item.category_name || "ไม่ระบุ"}
                            </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {/* ✅ Logic แสดงป้ายสี (Badge) */}
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              isIncoming(item.type) 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {isIncoming(item.type) ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                            {isIncoming(item.type) ? "รับเข้า" : "เบิกออก"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {/* ✅ Logic แสดงตัวเลข (+/-) */}
                          <span className={`text-base font-black ${isIncoming(item.type) ? "text-emerald-600" : "text-rose-600"}`}>
                            {isIncoming(item.type) ? "+" : "-"}{Number(item.quantity).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            {item.note && (
                              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                <FileText size={14} className="text-slate-400" /> {item.note}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key="empty">
                        <td colSpan={6} className="p-0 border-none">
                            <EmptyState />
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden flex flex-col gap-3">
                {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar size={12}/>
                                    {new Date(item.transaction_date).toLocaleDateString("th-TH")} 
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${isIncoming(item.type) ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                                    {isIncoming(item.type) ? "รับเข้า" : "เบิกออก"}
                                </span>
                            </div>

                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                        <img
                                            src={item.image_url || "https://via.placeholder.com/100?text=IMG"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.target.src = "https://via.placeholder.com/100?text=Error")}
                                            alt=""
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm truncate">{item.product_name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                            <Layers size={10} /> {item.category_name || "ไม่ระบุ"}
                                        </p>
                                    </div>
                                </div>
                                <div className={`text-lg font-black shrink-0 ${isIncoming(item.type) ? "text-emerald-600" : "text-rose-600"}`}>
                                    {isIncoming(item.type) ? "+" : "-"}{Number(item.quantity).toLocaleString()}
                                </div>
                            </div>

                            {(item.note) && (
                                <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                                    <FileText size={12} className="mt-0.5 text-slate-400 shrink-0" />
                                    <span className="break-words">{item.note}</span>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-10">
                        <EmptyState />
                    </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-10 md:py-20 text-slate-400 gap-3">
      <PackageX size={48} className="opacity-20" />
      <p>ไม่พบข้อมูลตามเงื่อนไข</p>
    </div>
  );
}