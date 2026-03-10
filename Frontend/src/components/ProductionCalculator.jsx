import React, { useState, useEffect } from "react";
import {
  Calculator,
  Package,
  DollarSign,
  Percent,
  RefreshCw,
  Save,
  TrendingUp,
  Tag,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Coins,
  LayoutGrid,
  Scale,
  Image as ImageIcon,
  Search,
  Layers, 
} from "lucide-react";

export default function ProductionCalculator() {
  // --- Inputs ---
  const [productName, setProductName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState(""); 
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("ชิ้น");
  const [margin, setMargin] = useState(30);

  // --- Data Lists ---
  const [variantOptions, setVariantOptions] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [existingProducts, setExistingProducts] = useState([]); 
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false); 
  
  // --- Variant State ---
  const [currentProductVariants, setCurrentProductVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(""); 
  const [variantNameInput, setVariantNameInput] = useState(""); 

  // --- Cost Breakdown State ---
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [costItems, setCostItems] = useState([
    { id: 1, name: "วัตถุดิบหลัก", amount: 0 },
    { id: 2, name: "ค่าบรรจุภัณฑ์", amount: 0 },
    { id: 3, name: "ค่าแรง/ค่าโสหุ้ย", amount: 0 },
  ]);
  const [manualTotalCost, setManualTotalCost] = useState(0);

  // --- Outputs ---
  const [totalCost, setTotalCost] = useState(0);
  const [costPerUnit, setCostPerUnit] = useState(0);
  const [pricePerUnit, setPricePerUnit] = useState(0);
  const [profitPerUnit, setProfitPerUnit] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState(0);

  const [currentOrgId, setCurrentOrgId] = useState(null);

  // ✅ 1. Load Initial Data (Products, Categories, Variant Options)
  useEffect(() => {
    let orgId = "";
    try {
      const userStr = localStorage.getItem("otop_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        orgId = user.organization_id;
        setCurrentOrgId(user.organization_id);
      }
    } catch (e) { console.error(e); }

    if (orgId) {
        // 1.1 Load Products
        fetch(`https://communitybi.sru.ac.th/api/products?org_id=${orgId}`)
            .then(res => res.json())
            .then(data => {
                const processed = data.map(p => ({
                    ...p,
                    variants: Array.isArray(p.variants) ? p.variants : (typeof p.variants === 'string' ? JSON.parse(p.variants) : [])
                }));
                setExistingProducts(processed);
            })
            .catch(err => console.error("Error loading products:", err));

        // 1.2 Load Categories
        fetch(`https://communitybi.sru.ac.th/api/categories?org_id=${orgId}`)
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                // Set default category if available
                if (data.length > 0 && !category) setCategory(data[0].name);
            })
            .catch(err => console.error("Error loading categories:", err));

        // 1.3 Load Variant Options (Standard Sizes)
        fetch(`https://communitybi.sru.ac.th/api/variant-options?org_id=${orgId}`)
            .then(res => res.json())
            .then(data => setVariantOptions(data))
            .catch(err => console.error("Error loading variants:", err));
    }
  }, []);

  // ✅ Search Suggestions Logic
  useEffect(() => {
      // Find matching product to auto-fill variants
      const match = existingProducts.find(p => p.name.toLowerCase() === productName.toLowerCase());
      if (match) {
          setCurrentProductVariants(match.variants || []);
          // Auto-fill other fields if empty
          if(match.image_url && !imageUrl) setImageUrl(match.image_url);
          if(match.category && !category) setCategory(match.category);
          if(match.unit && !unit) setUnit(match.unit);
      } else {
          setCurrentProductVariants([]);
          // Don't reset selectedVariantId immediately to allow typing new name
      }

      if (!productName) { setSearchSuggestions([]); return; }
      
      const lowerName = productName.toLowerCase();
      let suggestions = [];
      existingProducts.forEach(p => {
          if (p.name.toLowerCase().includes(lowerName)) {
              suggestions.push({ ...p, isVariant: false, displayName: p.name });
          }
      });
      setSearchSuggestions(suggestions.slice(0, 5));
  }, [productName, existingProducts]);

  const handleSelectProductSuggestion = (product) => {
    setProductName(product.name);
    setCategory(product.category || "");
    setUnit(product.unit || "ชิ้น");
    setImageUrl(product.image_url || "");
    setShowSuggestions(false);
  };

  const handleSelectVariant = (e) => {
      const vId = e.target.value;
      setSelectedVariantId(vId);
      
      if (vId === "new" || vId === "") { 
          setVariantNameInput(""); 
          return; 
      }
      
      // Check if user selected an existing variant (ID)
      const existingVar = currentProductVariants.find(v => v.id.toString() === vId.toString());
      if (existingVar) {
          setVariantNameInput(existingVar.name);
          // Auto-calculate margin based on old price
          if (existingVar.price && existingVar.cost && existingVar.cost > 0) {
              const oldMargin = ((existingVar.price - existingVar.cost) / existingVar.cost) * 100;
              setMargin(Math.round(oldMargin));
          }
          return;
      }
      
      // If selected from standard options (Name), use it directly
      setVariantNameInput(vId); 
  };

  // Auto-set Margin based on Category
  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setCategory(newCat);
    if(newCat.includes("อาหาร")) setMargin(40);
    else if(newCat.includes("เครื่องดื่ม")) setMargin(50);
    else if(newCat.includes("สมุนไพร")) setMargin(60);
    else setMargin(30);
  };

  // Calculate Total Cost
  useEffect(() => {
    if (showCostDetails) {
      const sum = costItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
      setTotalCost(sum);
    } else {
      setTotalCost(manualTotalCost);
    }
  }, [costItems, manualTotalCost, showCostDetails]);

  // Main Calculation (Price, Profit)
  useEffect(() => {
    const cost = parseFloat(totalCost) || 0;
    const qty = parseFloat(quantity) || 1;
    const mg = parseFloat(margin) || 0;

    const calculatedCostPerUnit = cost / qty;
    const calculatedProfitPerUnit = calculatedCostPerUnit * (mg / 100);
    const calculatedPrice = calculatedCostPerUnit + calculatedProfitPerUnit;

    setCostPerUnit(calculatedCostPerUnit);
    setProfitPerUnit(calculatedProfitPerUnit);
    setPricePerUnit(calculatedPrice);

    // Smart Rounding
    const roundPrice = Math.ceil(calculatedPrice);
    if (roundPrice % 10 < 5 && roundPrice % 10 !== 0) setSuggestedPrice(Math.ceil(roundPrice / 5) * 5);
    else if (roundPrice % 10 > 5 && roundPrice % 10 !== 9) setSuggestedPrice(Math.ceil(roundPrice / 10) * 10 - 1);
    else setSuggestedPrice(roundPrice);
  }, [totalCost, quantity, margin]);

  // Handlers
  const handleAddCostItem = () => setCostItems([...costItems, { id: Date.now(), name: "", amount: 0 }]);
  const handleRemoveCostItem = (id) => setCostItems(costItems.filter((item) => item.id !== id));
  const handleCostItemChange = (id, field, value) =>
    setCostItems(costItems.map((item) => item.id === id ? { ...item, [field]: value } : item));

  const handleReset = () => {
    setProductName(""); setImageUrl(""); setManualTotalCost(0); setQuantity(1); setUnit("ชิ้น"); setMargin(30);
    setVariantNameInput(""); setSelectedVariantId("");
    if(categories.length > 0) setCategory(categories[0].name);
    setCostItems([{ id: 1, name: "วัตถุดิบหลัก", amount: 0 }, { id: 2, name: "ค่าบรรจุภัณฑ์", amount: 0 }, { id: 3, name: "ค่าแรง/ค่าโสหุ้ย", amount: 0 }]);
  };

  // ✅ Revised Save Function (Handles both Create & Restock)
  const handleSaveProduct = async () => {
    if (!productName) return alert("กรุณาระบุชื่อสินค้า");
    if (!currentOrgId) return alert("กรุณาเข้าสู่ระบบใหม่");

    const costBreakdown = { material: 0, labor: 0, packaging: 0, utilities: 0, others: 0 };
    costItems.forEach(item => {
        const n = item.name.toLowerCase(), a = parseFloat(item.amount) || 0;
        if(n.includes("วัตถุดิบ")) costBreakdown.material += a; else if(n.includes("ค่าแรง")) costBreakdown.labor += a; else if(n.includes("บรรจุ")) costBreakdown.packaging += a; else if(n.includes("น้ำ")||n.includes("ไฟ")) costBreakdown.utilities += a; else costBreakdown.others += a;
    });
    if (!showCostDetails) costBreakdown.others = manualTotalCost;

    let finalVariantName = variantNameInput;
    // If user selected an ID from existing variants, map it to name
    if(selectedVariantId && selectedVariantId !== "new" && !variantOptions.find(v => v.name === selectedVariantId)) {
         const existingVar = currentProductVariants.find(v => v.id.toString() === selectedVariantId.toString());
         if(existingVar) finalVariantName = existingVar.name;
    }

    const priceToSave = suggestedPrice || pricePerUnit;

    // Payload for Restock (Update)
    const restockPayload = {
        org_id: currentOrgId, product_name: productName, variant_name: finalVariantName,
        add_stock: quantity, new_cost: costPerUnit, new_price: priceToSave
    };

    // Payload for Create New
    const createPayload = {
        name: productName, 
        category, 
        price: priceToSave, 
        cost: costPerUnit,
        stock: quantity, 
        unit, 
        image_url: imageUrl, 
        organization_id: currentOrgId,
        cost_breakdown: JSON.stringify(costBreakdown),
        variants: finalVariantName ? JSON.stringify([{ 
            name: finalVariantName,
            price: priceToSave,
            cost: costPerUnit,
            stock: quantity
        }]) : "[]" 
    };

    try {
        // 1. Try Restock First
        const res = await fetch("https://communitybi.sru.ac.th/api/products/restock", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(restockPayload)
        });
        const data = await res.json();

        if (res.ok) {
            alert(`✅ บันทึกสำเร็จ! อัปเดต ${productName} ${finalVariantName ? `(${finalVariantName})` : ''} เรียบร้อย`);
            handleReset();
            window.location.reload(); 
        } else if (res.status === 404) {
            // 2. Not Found -> Create New Product
             const createRes = await fetch("https://communitybi.sru.ac.th/api/products", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createPayload)
            });
            if(createRes.ok) { 
                alert(`🎉 สร้างสินค้าใหม่ "${productName}" สำเร็จ!`); 
                handleReset(); 
                window.location.reload(); 
            }
            else {
                const err = await createRes.json();
                alert("บันทึกไม่สำเร็จ: " + (err.message || "Unknown error"));
            }
        } else { 
            alert("บันทึกไม่สำเร็จ: " + data.message); 
        }
    } catch (e) { 
        console.error(e);
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ Server"); 
    }
  };

  const units = [ "ชิ้น", "ขวด", "ถุง", "กล่อง", "แพ็ค", "กระปุก", "แก้ว", "จาน", "กิโลกรัม", "ขีด", "ลิตร", "เมตร" ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 flex items-center gap-3"><div className="p-2 bg-slate-100 rounded-xl text-slate-800 shadow-sm"><Calculator size={24} /></div>Smart Calculator</h1>
          <p className="text-slate-400 font-medium mt-1 ml-1">คำนวณต้นทุนแม่นยำ กำไรไม่หาย</p>
        </div>
        <button onClick={handleReset} className="group flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-500 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"><RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" /> ล้างค่า</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-100/50 border border-slate-100 relative overflow-visible">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full -z-0"></div>
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 relative z-10"><span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span> ข้อมูลการผลิต</h3>
            <div className="space-y-6 relative z-10">
              
              {/* Product Name (Search) */}
              <div className="group relative">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">ชื่อสินค้า</label>
                <div className="relative">
                  <input type="text" value={productName} onChange={(e) => { setProductName(e.target.value); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} placeholder="ค้นหาหรือพิมพ์ชื่อใหม่..." className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-300" />
                  <div className="absolute right-4 top-3.5 text-slate-400 pointer-events-none"><Search size={20} /></div>
                  {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto custom-scrollbar">
                          {searchSuggestions.map((item, idx) => (
                              <div key={idx} onClick={() => handleSelectProductSuggestion(item)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"><span className="font-bold text-slate-700 text-sm">{item.displayName}</span><span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.category}</span></div>
                          ))}
                      </div>
                  )}
                  {showSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)}></div>}
                </div>
              </div>

              {/* ✅ Variant Selection (แก้ไขแล้ว: แสดงตัวเลือกขนาดจาก DB) */}
              <div className="group">
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2 ml-1"><Layers size={14}/> ขนาด / รูปแบบ</label>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <select 
                            value={selectedVariantId} 
                            onChange={handleSelectVariant} 
                            className="w-full pl-4 pr-10 py-3.5 bg-indigo-50 border-none rounded-2xl text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer" 
                            disabled={!productName}
                          >
                              <option value="">-- เลือกขนาด --</option>
                              
                              {/* 1. ขนาดที่มีอยู่แล้วของสินค้านี้ */}
                              {currentProductVariants.length > 0 && (
                                  <optgroup label="ขนาดที่มีอยู่แล้ว">
                                      {currentProductVariants.map((v) => (
                                        <option key={`curr-${v.id}`} value={v.id}>
                                            {v.name} (ราคาเดิม {v.price} บ.)
                                        </option>
                                      ))}
                                  </optgroup>
                              )}

                              {/* 2. ขนาดมาตรฐานจาก DB (variant_options) */}
                              {variantOptions.length > 0 && (
                                  <optgroup label="เพิ่มขนาดใหม่ (เลือกจากรายการ)">
                                      {variantOptions.map((opt) => (
                                        <option key={`opt-${opt.id}`} value={opt.name}>
                                            {opt.name}
                                        </option>
                                      ))}
                                  </optgroup>
                              )}
                              
                              <option value="new">+ พิมพ์ขนาดเอง...</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-4 text-indigo-400 pointer-events-none" size={16} />
                      </div>
                  </div>
                  
                  {/* Variant Name Input */}
                  {(selectedVariantId === "new" || (selectedVariantId && !currentProductVariants.find(v => v.id.toString() === selectedVariantId))) && (
                      <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                          <input 
                            type="text" 
                            value={variantNameInput} 
                            onChange={(e) => setVariantNameInput(e.target.value)} 
                            placeholder="ระบุชื่อขนาด (เช่น XL, สีแดง)" 
                            className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm text-indigo-700 font-medium focus:outline-none focus:border-indigo-300"
                          />
                      </div>
                  )}
              </div>

              {/* Image URL */}
              <div className="group">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">รูปภาพสินค้า (URL)</label>
                <div className="relative"><div className="absolute left-4 top-3.5 text-slate-400"><ImageIcon size={20} /></div><input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-slate-300 text-sm" /></div>
              </div>

              {/* Category (Loaded from DB) */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">หมวดหมู่</label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-slate-400"><LayoutGrid size={20} /></div>
                  <select value={category} onChange={handleCategoryChange} className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-none rounded-2xl text-slate-700 font-semibold focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer">
                    {categories.length > 0 ? categories.map((cat, idx) => <option key={idx} value={cat.name}>{cat.name}</option>) : <option value="">กำลังโหลด...</option>}
                    <option value="new">+ เพิ่มหมวดหมู่ใหม่</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={16} />
                </div>
                {category === "new" && <input type="text" className="mt-2 w-full p-2 border rounded-xl text-sm" placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..." onBlur={(e) => setCategory(e.target.value)} />}
              </div>

              {/* Cost, Qty, Margin */}
              <div className={`transition-all duration-300 border border-slate-100 rounded-3xl overflow-hidden ${showCostDetails ? "bg-white shadow-sm ring-4 ring-slate-50" : "bg-slate-50"}`}>
                <div className="p-5 flex justify-between items-center cursor-pointer" onClick={() => setShowCostDetails(!showCostDetails)}>
                  <div><label className="text-xs font-bold text-slate-400 uppercase block">ต้นทุนรวม (บาท)</label>{!showCostDetails && <div className="text-2xl font-black text-slate-700 mt-1">{manualTotalCost.toLocaleString()} บาท</div>}</div>
                  <button className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-400 shadow-sm hover:text-emerald-600 transition-colors">{showCostDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button>
                </div>
                {showCostDetails ? (
                  <div className="px-5 pb-5 space-y-3 bg-white">
                    {costItems.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input type="text" placeholder="รายการ" value={item.name} onChange={(e) => handleCostItemChange(item.id, "name", e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-sm font-medium focus:outline-none focus:bg-slate-100" />
                        <input type="number" placeholder="0" value={item.amount || ""} onChange={(e) => handleCostItemChange(item.id, "amount", parseFloat(e.target.value))} className="w-24 px-3 py-2 bg-slate-50 rounded-xl text-sm font-bold text-right focus:outline-none focus:bg-slate-100 text-slate-700" />
                        <button onClick={() => handleRemoveCostItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={handleAddCostItem} className="w-full py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"><Plus size={14} /> เพิ่มรายการ</button>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100"><span className="text-xs font-bold text-slate-400">ยอดรวมจริง</span><span className="text-lg font-black text-slate-800">{totalCost.toLocaleString()} บาท</span></div>
                  </div>
                ) : (
                  <div className="px-5 pb-5 pt-0"><div className="relative"><div className="absolute left-4 top-3.5 text-slate-400"><DollarSign size={18} /></div><input type="number" value={manualTotalCost || ""} onChange={(e) => setManualTotalCost(parseFloat(e.target.value))} placeholder="0.00" className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm border border-slate-100" /></div></div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">ปริมาณที่ผลิตได้ (เพิ่มสต็อก)</label>
                <div className="flex bg-slate-50 rounded-2xl p-1.5 shadow-inner">
                  <div className="relative flex-1"><div className="absolute left-4 top-3 text-slate-400"><Scale size={18} /></div><input type="number" value={quantity || ""} onChange={(e) => setQuantity(parseFloat(e.target.value))} className="w-full pl-12 pr-4 py-2.5 bg-white rounded-xl text-slate-700 font-bold focus:outline-none shadow-sm" /></div>
                  <div className="w-[1px] bg-slate-200 my-2 mx-1"></div>
                  <div className="relative w-1/3"><select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full h-full px-4 bg-transparent text-slate-600 font-bold text-center appearance-none cursor-pointer focus:outline-none">{units.map((u) => <option key={u} value={u}>{u}</option>)}</select><ChevronDown className="absolute right-2 top-3.5 text-slate-400 pointer-events-none" size={14} /></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3"><label className="text-xs font-bold text-slate-400 uppercase">กำไรที่ต้องการ</label><div className="text-2xl font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">{margin}%</div></div>
                <input type="range" min="0" max="200" value={margin} onChange={(e) => setMargin(parseFloat(e.target.value))} className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider"><span>เท่าทุน (0%)</span><span>กำไร 2 เท่า (200%)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Results --- */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-slate-400/50 relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-emerald-300 text-xs font-bold border border-white/10 backdrop-blur-md"><Tag size={14} /> ราคาขายแนะนำ (ต่อ{unit})</div>
                <div className="flex items-baseline gap-2"><h2 className="text-7xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{pricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-3xl md:text-4xl text-slate-500 font-bold">.{pricePerUnit.toFixed(2).split(".")[1]}</span></h2><span className="text-2xl font-light text-slate-400">บาท</span></div>
                {suggestedPrice > pricePerUnit && (<div className="mt-6 flex items-center gap-4 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 backdrop-blur-sm hover:bg-emerald-500/20 transition-all cursor-pointer group"><div className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform"><Coins size={20} /></div><div><p className="text-xs text-emerald-200 font-bold uppercase mb-0.5">ราคาเลขสวย (แนะนำ)</p><div className="flex items-baseline gap-2"><p className="text-2xl font-black text-white">{suggestedPrice} บาท</p><span className="text-xs text-emerald-400 font-medium">+กำไรเพิ่ม {(suggestedPrice - pricePerUnit).toFixed(2)} บาท</span></div></div></div>)}
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/10 backdrop-blur-md flex justify-between items-center"><div><p className="text-slate-400 text-xs font-bold uppercase mb-1">ต้นทุน (Cost)</p><p className="text-2xl font-bold text-white">{costPerUnit.toFixed(2)} บาท</p></div><div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><Package size={18} /></div></div>
                <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 backdrop-blur-md flex justify-between items-center relative overflow-hidden"><div><p className="text-emerald-300 text-xs font-bold uppercase mb-1">กำไร (Profit) <span className="opacity-50">/ {unit}</span></p><p className="text-3xl font-black text-emerald-400">+{profitPerUnit.toFixed(2)} บาท</p></div><div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"><TrendingUp size={18} /></div></div>
                <div className="pt-2 flex justify-between items-center text-sm px-2"><span className="text-slate-400">รายได้รวมทั้งล็อต</span><span className="text-white font-bold text-lg">{(pricePerUnit * quantity).toLocaleString()} บาท</span></div>
              </div>
            </div>
          </div>
          <button onClick={handleSaveProduct} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-bold text-xl hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-200/50 transition-all flex items-center justify-center gap-3 group active:scale-95"><Save size={28} className="group-hover:scale-110 transition-transform" /> บันทึกสินค้านี้ (อัปเดต/สร้างใหม่)</button>
        </div>
      </div>
    </div>
  );
}