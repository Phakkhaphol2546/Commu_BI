import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Save, Package, Layers, Box, Upload, Hammer, Zap, Sparkles,
  Calculator, ShoppingBag, Plus, Trash2, Scale, Percent, Settings,
  ChevronDown, Info, AlertTriangle, TrendingUp, Search, X,
  CheckCircle2, AlertCircle, Coins, ChevronRight, ClipboardCheck
} from "lucide-react";

export default function AddProduct({ onBack }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [orgId, setOrgId] = useState(null);
  const [userRole, setUserRole] = useState("User");

const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";

  const [variantOptions, setVariantOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [existingProducts, setExistingProducts] = useState([]);

  // --- Modal State ---
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    text: "",
    inputValue: "",
    onConfirm: null,
    confirmText: "ตกลง"
  });

  // --- Main Form State ---
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    stock: "",
    unit: "ชิ้น",
    image_url: "",
    price: 0,
    cost: 0,
  });

  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([{ name: "", stock: 0 }]);
  const [costs, setCosts] = useState({
    material: "", labor: "", packaging: "", utilities: "", others: "",
  });

  const [producedQty, setProducedQty] = useState(1);
  const [margin, setMargin] = useState(0);

  // Clean up preview URL memory
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setOrgId(user.organization_id);
        setUserRole(user.role || "User");
        fetchVariantOptions(user.organization_id);
        fetchCategories(user.organization_id);
        fetchProducts(user.organization_id);
      }
    } catch (e) {
      console.error("User parsing error:", e);
    }
  }, []);

  const fetchVariantOptions = async (oid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/variant-options?org_id=${oid}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setVariantOptions(data);
    } catch (error) { console.error("Load variants failed:", error); }
  };

  const fetchCategories = async (oid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories?org_id=${oid}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCategoryOptions(data);
        if (!formData.category_id) setFormData(p => ({ ...p, category_id: data[0].id }));
      }
    } catch (error) { console.error("Load categories failed:", error); }
  };

  const fetchProducts = async (oid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?org_id=${oid}`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setExistingProducts(data);
    } catch (error) { console.error("Load products failed:", error); }
  };

  // ✅ Auto Calculator Logic
  useEffect(() => {
    let totalStock = 0;
    if (hasVariants) {
      totalStock = variants.reduce((sum, v) => sum + (parseFloat(v.stock) || 0), 0);
      setProducedQty(totalStock || 1);
    } else {
      setProducedQty(parseFloat(formData.stock) || 1);
    }
  }, [variants, hasVariants, formData.stock]);

  useEffect(() => {
    const totalBatchCost = Object.values(costs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const qty = parseFloat(producedQty) || 1;
    setFormData(prev => ({ ...prev, cost: totalBatchCost / qty }));
  }, [costs, producedQty]);

  useEffect(() => {
    if (formData.price > 0) {
      const calculatedMargin = ((formData.price - formData.cost) / formData.price) * 100;
      setMargin(calculatedMargin);
    } else {
      setMargin(0);
    }
  }, [formData.price, formData.cost]);

  const handleSelectProduct = (productId) => {
    if (!productId) return;
    const prod = existingProducts.find(p => p.id === Number(productId));
    if (!prod) return;

    setSelectedFile(null);
    setPreviewUrl("");
    setFormData({
      ...formData,
      name: prod.name,
      category_id: prod.category_id || "",
      unit: prod.unit || "ชิ้น",
      image_url: prod.image_url || "",
      price: prod.price || 0,
      cost: prod.cost || 0,
    });

    if (prod.variants?.length > 0) {
      setHasVariants(true);
      setVariants(prod.variants.map(v => ({ name: v.name, stock: 0 })));
    }

    setModal({
      isOpen: true, type: "success", title: "โหลดข้อมูลสำเร็จ",
      text: `เชื่อมต่อข้อมูลของ "${prod.name}" เข้าสู่ฟอร์มแล้ว`,
      confirmText: "เริ่มบันทึกการผลิต"
    });
  };

  const saveProduct = async () => {
    if (!formData.name) {
      setModal({ isOpen: true, type: "error", title: "ข้อมูลไม่ครบ", text: "กรุณาระบุชื่อสินค้า" });
      return;
    }

    const data = new FormData();
    data.append("org_id", orgId);
    data.append("name", formData.name);
    data.append("category_id", formData.category_id);
    data.append("unit", formData.unit);
    data.append("cost_breakdown", JSON.stringify(costs));
    data.append("price", formData.price);
    data.append("cost", formData.cost);
    
    // --- เพิ่มสำหรับสมุดบัญชี ---
    data.append("transaction_type", "expense"); 
    data.append("note", `บันทึกต้นทุนการผลิต: ${formData.name}`);

    if (selectedFile) {
      data.append("image", selectedFile);
    } else if (formData.image_url) {
      data.append("image_url", formData.image_url);
    }

    if (hasVariants) {
      // ตัดรายการที่ไม่ได้เลือกชื่อแบบออก
      const validVariants = variants.filter(v => v.name.trim() !== "");
      data.append("variants", JSON.stringify(validVariants.map(v => ({ ...v, price: formData.price, cost: formData.cost }))));
      data.append("stock", validVariants.reduce((sum, v) => sum + Number(v.stock || 0), 0));
    } else {
      data.append("stock", Number(formData.stock) || 0);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, { 
        method: "POST", 
        body: data 
      });

      // อ่าน Response แบบ Text ก่อนเพื่อดักจับ Error ที่เป็น HTML จาก Server
      const textResponse = await res.text();
      let result;
      
      try {
        result = JSON.parse(textResponse);
      } catch (e) {
        console.error("Server Error Response:", textResponse);
        throw new Error("เซิร์ฟเวอร์ตอบกลับผิดปกติ (อาจจะตาย หรือ Path ผิด)");
      }

      if (res.ok) {
        setModal({
          isOpen: true, 
          type: "success", 
          title: "บันทึกเรียบร้อย!",
          text: "ระบบอัปเดตสต็อกและบันทึกบัญชีรายจ่ายให้คุณแล้ว",
          confirmText: "ตกลง",
          onConfirm: () => onBack()
        });
      } else {
        setModal({ 
          isOpen: true, 
          type: "error", 
          title: "บันทึกไม่สำเร็จ", 
          text: result.message || "เซิร์ฟเวอร์ปฏิเสธการบันทึกข้อมูล" 
        });
      }
    } catch (e) {
      console.error("Connection error:", e);
      setModal({ 
        isOpen: true, 
        type: "error", 
        title: "การเชื่อมต่อล้มเหลว", 
        text: e.message || "ไม่สามารถติดต่อฐานข้อมูลได้ โปรดตรวจสอบ Console (F12)" 
      });
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  // Safe Image URL renderer
  const renderImageUrl = () => {
    if (previewUrl) return previewUrl;
    if (!formData.image_url) return null;
    const imgStr = String(formData.image_url);
    if (imgStr.startsWith('http')) return imgStr;
    return `${API_BASE_URL}/uploads/${imgStr}`;
  };

  const costItemStyles = {
    material: "group-focus-within:bg-indigo-50 group-focus-within:text-indigo-500 group-focus-within:border-indigo-200 text-indigo-400 bg-indigo-50/50",
    labor: "group-focus-within:bg-orange-50 group-focus-within:text-orange-500 group-focus-within:border-orange-200 text-orange-400 bg-orange-50/50",
    packaging: "group-focus-within:bg-blue-50 group-focus-within:text-blue-500 group-focus-within:border-blue-200 text-blue-400 bg-blue-50/50",
    utilities: "group-focus-within:bg-yellow-50 group-focus-within:text-yellow-500 group-focus-within:border-yellow-200 text-yellow-500 bg-yellow-50/50",
    others: "group-focus-within:bg-pink-50 group-focus-within:text-pink-500 group-focus-within:border-pink-200 text-pink-400 bg-pink-50/50",
  };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 flex flex-col font-sans animate-in fade-in duration-500 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6 sm:mb-8">
        <button onClick={onBack} className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:bg-slate-50 text-slate-500 shadow-sm active:scale-95 transition-all">
          <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 sm:gap-3">
            <span className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-200/50">
              <Package size={20} className="sm:w-6 sm:h-6" />
            </span>
            บันทึกการผลิต
          </h1>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 bg-white rounded-3xl lg:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row">

        {/* ================= LEFT: Product Info ================= */}
        <div className="w-full lg:w-1/2 xl:w-[45%] bg-slate-50/30 p-5 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto custom-scrollbar">
          <div className="space-y-6 sm:space-y-8 max-w-xl mx-auto">
            
            {/* Search Existing */}
            <div className="relative group">
              <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                เลือกสินค้าเดิมในคลัง (ตัวเลือก)
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                <select
                  className="w-full h-12 sm:h-14 pl-12 pr-12 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-700 text-sm sm:text-base appearance-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm cursor-pointer"
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  value=""
                >
                  <option value="">-- ค้นหาสินค้าเพื่อผลิตเพิ่ม --</option>
                  {existingProducts.map(p => {
                    const variantText = p.variants && p.variants.length > 0 
                      ? ` [ขนาด: ${p.variants.map(v => v.name).join(", ")}]` 
                      : "";
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {variantText}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            <hr className="border-slate-200 border-dashed" />

            {/* Image Upload */}
            <div className="flex flex-col">
              <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-2 block">
                รูปภาพสินค้า
              </label>
              <input type="file" ref={fileInputRef} onChange={(e) => {
                const file = e.target.files[0];
                if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
              }} className="hidden" accept="image/*" />
              <div 
                onClick={() => fileInputRef.current.click()} 
                className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer rounded-2xl sm:rounded-[2rem] flex items-center justify-center overflow-hidden transition-all group relative"
              >
                {renderImageUrl() ? (
                  <img src={renderImageUrl()} alt="Preview" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="text-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-slate-300 group-hover:text-indigo-500 group-hover:shadow-md transition-all">
                      <Upload size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">อัปโหลดรูปภาพ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div className="sm:col-span-2">
                <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-2 block">ชื่อสินค้า</label>
                <input 
                  type="text" 
                  className="w-full h-12 sm:h-14 px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  placeholder="เช่น น้ำพริหนุ่ม, กระเป๋าสาน..." 
                />
              </div>
              <div>
                <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-2 block">หมวดหมู่</label>
                <div className="relative">
                  <select 
                    className="w-full h-12 sm:h-14 px-4 sm:px-5 pr-10 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-700 text-sm sm:text-base appearance-none outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                    value={formData.category_id} 
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider ml-1 mb-2 block">หน่วยนับ</label>
                <input 
                  type="text" 
                  className="w-full h-12 sm:h-14 px-4 sm:px-5 rounded-xl sm:rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-800 text-sm sm:text-base outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                  value={formData.unit} 
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="ชิ้น, กล่อง, ถุง..."
                />
              </div>
            </div>

            {/* Variants / Stock Section */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-sm sm:text-base font-black text-slate-800 block">ปริมาณที่ผลิตได้</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">ระบุจำนวนสินค้าที่พร้อมขาย</span>
                </div>
                <button type="button" onClick={() => setHasVariants(!hasVariants)} className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full p-1 transition-all flex items-center ${hasVariants ? "bg-indigo-600" : "bg-slate-200"}`}>
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-sm transform transition-all duration-300 ${hasVariants ? "translate-x-5 sm:translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              {hasVariants ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 flex px-2">
                    <span className="flex-1">ขนาด/แบบ</span>
                    <span className="w-24 text-center">จำนวน</span>
                    <span className="w-8"></span>
                  </div>
                  {variants.map((v, i) => (
                    <div key={i} className="flex gap-2 sm:gap-3 items-center bg-slate-50 p-2 sm:p-3 rounded-xl border border-slate-100 transition-all hover:border-slate-300">
                      <select className="flex-1 h-10 sm:h-12 px-3 rounded-lg sm:rounded-xl border border-slate-200 bg-white font-bold text-xs sm:text-sm outline-none focus:border-indigo-500" value={v.name} onChange={(e) => handleVariantChange(i, "name", e.target.value)}>
                        <option value="">เลือกแบบ...</option>
                        {variantOptions.map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)}
                      </select>
                      <input type="number" className="w-20 sm:w-24 h-10 sm:h-12 px-2 border border-slate-200 bg-white rounded-lg sm:rounded-xl text-center font-black text-indigo-600 text-sm sm:text-base outline-none focus:border-indigo-500" value={v.stock} onChange={(e) => handleVariantChange(i, "stock", e.target.value)} placeholder="0" />
                      <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setVariants([...variants, { name: "", stock: 0 }])} className="w-full mt-2 py-3 border-2 border-dashed border-indigo-200 rounded-xl text-xs font-black text-indigo-500 uppercase hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> เพิ่มตัวเลือก
                  </button>
                </div>
              ) : (
                <div className="relative mt-2">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={24} />
                  <input 
                    type="number" 
                    className="w-full h-14 sm:h-16 pl-14 pr-6 text-2xl sm:text-3xl font-black text-indigo-600 bg-indigo-50/50 border-2 border-indigo-100 rounded-xl sm:rounded-2xl outline-none focus:border-indigo-400 transition-all placeholder:text-indigo-200" 
                    value={formData.stock} 
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })} 
                    placeholder="0" 
                    onFocus={(e) => e.target.select()}
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-bold text-indigo-400">{formData.unit}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT: Calculator ================= */}
        <div className="w-full lg:flex-1 bg-white p-5 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto flex flex-col relative">
          
          <div className="max-w-2xl mx-auto w-full h-full flex flex-col">
            {/* Dark Header Banner */}
            <div className="mb-8 sm:mb-10 bg-slate-900 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Calculator size={100} />
              </div>
              <div className="relative z-10">
                <h3 className="font-black text-lg sm:text-2xl flex items-center gap-2"> 
                  คำนวณต้นทุนการผลิต
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-[80%]">ใส่รายจ่ายที่ใช้ในการผลิตล็อตนี้</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row gap-8 xl:gap-12">
              
              {/* Cost Inputs List */}
              <div className="flex-1 space-y-4 sm:space-y-5">
                {[
                  { label: "ค่าวัตถุดิบหลัก", name: "material", icon: <ShoppingBag size={20} />, key: "material" },
                  { label: "ค่าจ้างแรงงาน", name: "labor", icon: <Hammer size={20} />, key: "labor" },
                  { label: "วัสดุ/บรรจุภัณฑ์", name: "packaging", icon: <Box size={20} />, key: "packaging" },
                  { label: "ค่าน้ำ/ไฟ/แก๊ส", name: "utilities", icon: <Zap size={20} />, key: "utilities" },
                  { label: "รายจ่ายอื่นๆ", name: "others", icon: <Coins size={20} />, key: "others" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3 sm:gap-4 group relative">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-100 transition-all shrink-0 ${costItemStyles[item.key]}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 pb-2 border-b-2 border-slate-100 group-focus-within:border-indigo-400 transition-colors">
                      <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wide block mb-1 cursor-text">
                        {item.label}
                      </label>
                      <div className="relative flex items-center">
                        <span className="text-slate-300 font-bold mr-1">฿</span>
                        <input 
                          type="number" 
                          className="w-full bg-transparent outline-none font-black text-lg sm:text-xl text-slate-800 placeholder:text-slate-200" 
                          value={costs[item.name]} 
                          onChange={(e) => setCosts({ ...costs, [item.name]: e.target.value })} 
                          placeholder="0.00" 
                          onFocus={(e) => e.target.select()} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Card */}
              <div className="flex-1 w-full xl:w-[320px] shrink-0">
                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 text-center sticky top-0">
                  
                  <div className="mb-6">
                    <p className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">ต้นทุนเฉลี่ยต่อ {formData.unit}</p>
                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-rose-500">
                      <span className="text-xl sm:text-3xl font-bold mt-1">฿</span>
                      <p className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter truncate">
                        {formData.cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>

                  <div className="space-y-4 text-left bg-slate-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-slate-600 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-500"/> กำหนดราคาขาย
                      </p>
                      <div className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full ${margin >= 20 ? 'bg-emerald-100 text-emerald-600' : margin > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                        กำไร {margin.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <input 
                        type="number" 
                        className="w-full bg-white border-2 border-slate-200 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-2xl sm:text-3xl font-black text-emerald-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-center" 
                        value={formData.price || ""} 
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} 
                        placeholder="0.00"
                        onFocus={(e) => e.target.select()}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase pointer-events-none">THB</span>
                    </div>
                  </div>
                  
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button 
                onClick={onBack} 
                className="w-full sm:w-1/3 py-4 rounded-xl sm:rounded-2xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:scale-95 transition-all text-sm sm:text-base"
              >
                ยกเลิก
              </button>
              <button 
                onClick={saveProduct} 
                disabled={formData.price <= 0 || !formData.name}
                className={`w-full sm:flex-1 py-4 rounded-xl sm:rounded-2xl text-white font-black text-base sm:text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${formData.price <= 0 || !formData.name ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-slate-900 hover:bg-black active:scale-[0.98]'}`}
              >
                <Save size={20} className="sm:w-6 sm:h-6" /> บันทึกและอัปเดตสต็อก
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL SYSTEM */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-sm p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5 sm:mb-6">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center ${modal.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"}`}>
                {modal.type === "success" ? <CheckCircle2 size={40} className="sm:w-12 sm:h-12" /> : <AlertCircle size={40} className="sm:w-12 sm:h-12" />}
              </div>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2 text-center">{modal.title}</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8 text-center px-2">{modal.text}</p>
            <button
              onClick={() => {
                if (modal.onConfirm) modal.onConfirm();
                setModal({ ...modal, isOpen: false });
              }}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-slate-900 text-white font-black text-sm sm:text-base hover:bg-black active:scale-95 transition-all"
            >
              {modal.confirmText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}