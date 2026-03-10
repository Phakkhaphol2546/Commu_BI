import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Save,
  ArrowLeft,
  Loader2,
  Package,
  X,
  Tags,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle,
  Calendar,
  Check,
  History,
  Clock,
  ChevronRight
} from "lucide-react";

export default function SalesAction({ onBack, onRecordSale }) {
  // ✅ ใช้วันที่ปัจจุบันตามเวลาท้องถิ่น (Local Time) ในรูปแบบ YYYY-MM-DD
  const getLocalDate = () => new Date().toLocaleDateString('sv-SE');

  // ✅ ฟังก์ชันแปลงวันที่เป็นรูปแบบไทย (วันที่/เดือน/ปี พ.ศ.) แบบระบุเวลาด้วย
  const formatThaiDate = (dateStr, includeTime = false) => {
    if (!dateStr) return "";
    // รองรับทั้ง YYYY-MM-DD และ YYYY-MM-DD HH:mm:ss
    const parts = dateStr.split(" ");
    const datePart = parts[0];
    const timePart = parts[1];
    
    const [year, month, day] = datePart.split("-");
    const date = new Date(year, month - 1, day);
    
    // แสดงผลเป็น วันที่/เดือน/ปี (พ.ศ.)
    const dateFormatted = date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return includeTime && timePart ? `${dateFormatted} ${timePart.substring(0, 5)} น.` : dateFormatted;
  };

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(null);
  const [saleDate, setSaleDate] = useState(getLocalDate());
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [sessionHistory, setSessionHistory] = useState([]);

const API_BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : "https://communitybi.sru.ac.th";
  
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

  const showConfirm = (title, text, onConfirmCallback) => {
    setCustomModal({
      isOpen: true,
      title,
      text,
      type: "question",
      showCancel: true,
      confirmText: "ยืนยันการขาย",
      cancelText: "ยกเลิก",
      onConfirm: onConfirmCallback,
    });
  };

  const closeAlert = () => {
    setCustomModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const userStr = localStorage.getItem("otop_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setOrgId(user.organization_id);
      fetch(`${API_BASE_URL}/api/products?org_id=${user.organization_id}`)
        .then((res) => res.json())
        .then((data) => {
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm, products]
  );

  const addToCart = (product) => {
    if (product.stock <= 0) return showAlert("สินค้าหมด!", "สินค้านี้ไม่มีในสต็อก", "error");
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty + 1 > product.stock)
        return showAlert("สต็อกไม่พอ", "จำนวนในตะกร้าเกินสต็อกที่มี", "warning");
      setCart(cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart([...cart, { ...product, qty: 1, discount: 0, isSample: false }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const product = products.find((p) => p.id === id);
            const newQty = Math.max(0, item.qty + delta);
            if (newQty > product.stock) {
              showAlert("สต็อกไม่พอ", "ไม่สามารถเพิ่มได้มากกว่านี้", "warning");
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const updateDiscount = (id, amount) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          let disc = Math.max(0, Number(amount));
          if (disc > item.price * item.qty) disc = item.price * item.qty;
          return { ...item, discount: disc, isSample: false };
        }
        return item;
      })
    );
  };

  const toggleSample = (id) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const isS = !item.isSample;
          return { ...item, isSample: isS, discount: isS ? item.price * item.qty : 0 };
        }
        return item;
      })
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty - (item.discount || 0), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const executeSave = async () => {
    const userStr = localStorage.getItem("otop_user");
    const userData = userStr ? JSON.parse(userStr) : null;

    if (!orgId || !userData?.id) {
      return showAlert("ข้อมูลไม่ครบ", "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง", "error");
    }

    setCustomModal((p) => ({ ...p, isOpen: false }));

    const now = new Date();
    const currentTimeStr = now.toTimeString().split(' ')[0];
    const fullSaleDateTime = `${saleDate} ${currentTimeStr}`;

    const orderData = {
      org_id: Number(orgId),
      user_id: Number(userData.id),
      customer_name: "ลูกค้าทั่วไป",
      payment_method: "เงินสด",
      channel: "หน้าร้าน",
      total_amount: Number(totalAmount) || 0,
      sale_date: fullSaleDateTime,
      items: cart.map((item) => {
        let finalPrice = (item.price * item.qty - (item.discount || 0)) / item.qty;
        if (item.isSample || finalPrice <= 0) finalPrice = 0.01;

        return {
          product_id: item.id,
          quantity: item.qty,
          price: Number(finalPrice),
          cost: Number(item.cost) || 0,
        };
      }),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();

      if (res.ok) {
        const newHistory = {
          id: result.orderId,
          time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
          date: formatThaiDate(saleDate),
          summary: cart.map(i => `${i.name} (x${i.qty})`).join(", "),
          total: totalAmount
        };
        setSessionHistory(prev => [newHistory, ...prev]);

        // ✅ แก้ไข: เมื่อขายสำเร็จ ให้เด้งกลับไปหน้า SalesRecord (onBack) เมื่อกด "ตกลง"
        setCustomModal({
          isOpen: true,
          title: "สำเร็จ!",
          text: `บันทึกการขายเรียบร้อย เลขที่ #${result.orderId}\nกำลังนำคุณกลับไปยังหน้าประวัติการขาย`,
          type: "success",
          showCancel: false,
          confirmText: "ตกลง",
          onConfirm: () => {
            onBack(); // กลับไปหน้า SalesRecord
            closeAlert();
          }
        });

        if (onRecordSale) {
          onRecordSale({
            totalAmount,
            ref: `ORD-${result.orderId}`,
            date: fullSaleDateTime,
          });
        }

        setCart([]);
        setIsCartOpen(false);
      } else {
        showAlert("ผิดพลาด", result.message || "Data incomplete", "error");
      }
    } catch (error) {
      showAlert("Error", "เชื่อมต่อ Server ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ", "error");
    }
  };

  const handleConfirmClick = () => {
    if (cart.length === 0) return showAlert("ตะกร้าว่าง", "กรุณาเลือกสินค้าก่อน", "warning");
    const itemsSummary = cart.map(item => `${item.name} (x${item.qty})`).join(", ");
    
    showConfirm(
      "ยืนยันการขาย?",
      `สินค้า: ${itemsSummary}\nยอดรวม ฿${totalAmount.toLocaleString()}\nวันที่บันทึก: ${formatThaiDate(saleDate)}`,
      executeSave
    );
  };

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p>กำลังโหลดสินค้า...</p>
      </div>
    );

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-3 w-full">
          <button onClick={onBack} className="p-2.5 bg-slate-50 border rounded-xl active:scale-95 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 border-none text-sm focus:ring-2 focus:ring-emerald-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Catalog */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-6 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {filteredProducts.map((p) => {
                const inCart = cart.find(item => item.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={`bg-white p-3 rounded-xl border-2 transition-all active:scale-95 cursor-pointer relative group ${inCart ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/10" : "border-transparent shadow-sm"} ${p.stock <= 0 ? "opacity-50 grayscale pointer-events-none" : "hover:border-emerald-200"}`}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg z-10 border-2 border-white">
                        {inCart.qty}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-white shadow-sm z-10">
                      สต็อก: {p.stock}
                    </div>
                    <div className="aspect-square bg-slate-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center p-2 relative">
                      <img src={p.image_url || "https://via.placeholder.com/150"} className="max-w-full max-h-full object-contain" alt="" />
                      {inCart && <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center"><Check className="text-indigo-600 opacity-40" size={48} /></div>}
                    </div>
                    <h3 className="font-bold text-slate-700 truncate text-sm">{p.name}</h3>
                    <p className="text-emerald-600 font-black">฿{p.price.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            {/* ประวัติการขายในรอบนี้ */}
            {sessionHistory.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-6 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                   <History className="text-slate-400" size={18} />
                   <h3 className="font-black text-slate-600 uppercase text-[10px] tracking-widest">ประวัติการขายในรอบนี้</h3>
                </div>
                <div className="space-y-2">
                   {sessionHistory.map((h) => (
                     <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm transition-all hover:border-emerald-100">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle2 size={16} /></div>
                           <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-xs">#ORD-{h.id}</span>
                                <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                  <Calendar size={10}/> {h.date} <Clock size={10} className="ml-1"/> {h.time}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate max-w-[200px] md:max-w-md">{h.summary}</p>
                           </div>
                        </div>
                        <span className="text-xs font-black text-slate-700 text-right">฿{h.total.toLocaleString()}</span>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Cart Desktop */}
        <div className="hidden lg:flex w-[380px] bg-white border-l flex-col shadow-xl z-30 overflow-hidden">
          <CartContent
            cart={cart}
            setCart={setCart}
            updateQty={updateQty}
            updateDiscount={updateDiscount}
            toggleSample={toggleSample}
            saleDate={saleDate}
            setSaleDate={setSaleDate}
            totalAmount={totalAmount}
            onSave={handleConfirmClick}
            formatThaiDate={formatThaiDate}
          />
        </div>
      </div>

      {/* Mobile UI Buttons & Modals */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <button onClick={() => setIsCartOpen(true)} className="w-full bg-slate-900 text-white rounded-xl py-4 flex justify-between items-center active:scale-95">
          <div className="flex items-center gap-3 ml-2">
            <ShoppingCart size={20} className="text-emerald-400" />
            <span className="font-bold">ตะกร้า ({totalItems})</span>
          </div>
          <span className="font-black text-lg mr-2">฿{totalAmount.toLocaleString()}</span>
        </button>
      </div>

      {isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="bg-white w-full rounded-t-[2rem] relative z-10 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-black flex items-center gap-2"><ShoppingCart className="text-emerald-500" /> รายการขาย</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <CartItemsList cart={cart} setCart={setCart} updateQty={updateQty} updateDiscount={updateDiscount} toggleSample={toggleSample} />
            </div>
            <div className="p-6 bg-slate-50 border-t">
              <div className="flex justify-between items-center mb-4 text-2xl font-black">
                <span className="text-slate-500 text-sm font-bold uppercase">ยอดสุทธิ</span>
                <span>฿{totalAmount.toLocaleString()}</span>
              </div>
              <button onClick={handleConfirmClick} disabled={cart.length === 0} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95">ยืนยันการขาย</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal System */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 text-center">
            <div className="flex justify-center mb-4">
              {customModal.type === "success" ? <CheckCircle2 size={60} className="text-emerald-500" /> : customModal.type === "error" ? <AlertCircle size={60} className="text-rose-500" /> : <HelpCircle size={60} className="text-indigo-500" />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{customModal.title}</h3>
            <p className="text-slate-500 mb-8 whitespace-pre-wrap text-sm">{customModal.text}</p>
            <div className="flex gap-3">
              {customModal.showCancel && <button onClick={() => setCustomModal((p) => ({ ...p, isOpen: false }))} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">ยกเลิก</button>}
              <button onClick={() => customModal.onConfirm ? customModal.onConfirm() : setCustomModal((p) => ({ ...p, isOpen: false }))} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold active:scale-95">{customModal.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Components ---

function CartContent({ cart, setCart, updateQty, updateDiscount, toggleSample, saleDate, setSaleDate, totalAmount, onSave, formatThaiDate }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b bg-slate-50/50 space-y-4">
        {/* ส่วนเลือกวันที่แสดงด้านบนสุดพร้อมตัวเลขสีดำที่ชัดเจน */}
        <div className="bg-white p-3 rounded-2xl border-2 border-indigo-100 shadow-sm relative group hover:border-indigo-300 transition-colors cursor-pointer">
          <label className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-1 mb-1.5">
            <Calendar size={12} /> วันที่บันทึกรายการ
          </label>
          
          <div className="flex items-center justify-between relative">
            {/* ตัวเลขสีดำที่แสดงผลในรูปแบบไทย วัน/เดือน/ปี */}
            <span className="text-lg font-black text-black pointer-events-none">
              {formatThaiDate(saleDate)}
            </span>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            
            {/* Input จริงซ่อนไว้ด้านหลังแต่ทำงานได้ปกติ */}
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              max={new Date().toLocaleDateString('sv-SE')} 
            />
          </div>
        </div>
        
        <h2 className="text-xl font-black flex items-center gap-2 text-slate-800"><ShoppingCart className="text-emerald-500" /> ตะกร้าสินค้า</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        <CartItemsList cart={cart} setCart={setCart} updateQty={updateQty} updateDiscount={updateDiscount} toggleSample={toggleSample} />
      </div>
      
      <div className="p-6 border-t bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0">
        <div className="flex justify-between items-end mb-6 px-1">
          <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">ยอดสุทธิรวม</span>
          <span className="text-4xl font-black text-slate-800 tracking-tighter tabular-nums">฿{totalAmount.toLocaleString()}</span>
        </div>
        <button
          onClick={onSave}
          disabled={cart.length === 0}
          className={`w-full py-5 rounded-[1.5rem] font-bold text-lg shadow-xl transition-all active:scale-95 ${cart.length > 0 ? "bg-slate-900 text-white hover:bg-black" : "bg-slate-200 text-slate-400"}`}
        >
          บันทึกการขาย
        </button>
      </div>
    </div>
  );
}

function CartItemsList({ cart, setCart, updateQty, updateDiscount, toggleSample }) {
  const [showD, setShowD] = useState({});
  if (cart.length === 0)
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2 opacity-60 mt-10">
        <ShoppingCart size={48} />
        <p className="font-bold uppercase text-[10px] tracking-widest">ยังไม่มีสินค้าในตะกร้า</p>
      </div>
    );
  return cart.map((item) => (
    <div key={item.id} className={`flex flex-col gap-2 p-4 border rounded-2xl transition-all ${item.isSample ? "border-amber-200 bg-amber-50/40 shadow-sm" : "border-slate-100 bg-white shadow-sm"}`}>
      <div className="flex gap-3">
        <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 border border-slate-200">
          <img src={item.image_url || "https://via.placeholder.com/150"} className="max-w-full max-h-full object-contain" alt="" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start text-slate-700">
            <h4 className="font-bold text-sm truncate pr-2">{item.name}</h4>
            <button onClick={() => setCart(cart.filter((i) => i.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-sm font-black ${item.isSample ? "text-slate-400 line-through" : "text-emerald-600"}`}>฿{item.price.toLocaleString()}</span>
            <label className="flex items-center gap-1.5 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer" checked={item.isSample} onChange={() => toggleSample(item.id)} />
              <span className={`text-[9px] font-black uppercase tracking-wider ${item.isSample ? "text-amber-600" : "text-slate-400 group-hover:text-slate-600"}`}>สินค้าทดลอง</span>
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
        <div className="flex items-center gap-3 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
          <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 rounded transition-colors"><Minus size={10} /></button>
          <span className="text-xs font-black w-6 text-center tabular-nums">{item.qty}</span>
          <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 rounded transition-colors"><Plus size={10} /></button>
        </div>
        <div className="text-right tabular-nums">
          {item.isSample ? <span className="text-amber-600 font-black text-[10px] bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">แจกฟรี 0.01</span> : <span className="text-slate-800 font-black">฿{(item.price * item.qty - (item.discount || 0)).toLocaleString()}</span>}
        </div>
      </div>
      {!item.isSample && (
        <div className="flex items-center justify-between px-1">
          <button onClick={() => setShowD((p) => ({ ...p, [item.id]: !p[item.id] }))} className={`text-[10px] font-bold ${item.discount > 0 ? "text-red-500" : "text-indigo-500"}`}> {item.discount > 0 ? `ลด ฿${item.discount}` : "+ เพิ่มส่วนลด"} </button>
          {(showD[item.id] || item.discount > 0) && (
            <input type="number" className="w-24 h-7 px-2 text-[10px] font-black text-red-500 bg-red-50 border border-red-100 rounded outline-none focus:ring-1 focus:ring-red-200" placeholder="ระบุจำนวน" value={item.discount || ""} onChange={(e) => updateDiscount(item.id, e.target.value)} />
          )}
        </div>
      )}
    </div>
  ));
}