import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  Table,
  Filter,
  Layers,
  Check,
  X,
  ChevronDown,
  RefreshCw,
  Loader2,
  Building2,
  Edit3,
  Lock,
  AlertCircle,
  CheckCircle2,
  Info,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  BarChart3,
  ShoppingBag,
} from "lucide-react";

const GeneralLedger = ({ accountName = "เงินสด", accountNumber = "101" }) => {
  const today = new Date().toLocaleDateString("sv-SE");

  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : "https://communitybi.sru.ac.th";

  const [dbEntries, setDbEntries] = useState([]);

  console.log("dbEntries :" , dbEntries)
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState("");
  const [newlyAddedId, setNewlyAddedId] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summarySelectedProduct, setSummarySelectedProduct] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    date: today,
    description: "",
    category: "ทั่วไป",
    type: "income",
    amount: "",
  });

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

  const showConfirm = (
    title,
    text,
    type = "warning",
    confirmText = "ตกลง",
    onConfirmCallback,
  ) => {
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

  const closeAlert = () =>
    setCustomModal((prev) => ({ ...prev, isOpen: false }));

  const categories = [
    "รายรับ (ขายสินค้า)",
    "รายรับ (อื่นๆ)",
    "ค่าวัตถุดิบ/ผลิต",
    "ค่าบรรจุภัณฑ์",
    "ค่าขนส่ง",
    "ค่าแรง/เงินเดือน",
    "ค่าน้ำ/ค่าไฟ",
    "ถอนใช้ส่วนตัว",
    "อื่นๆ",
  ];

  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem("otop_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.organization_id) {
            setOrgId(parseInt(user.organization_id));
            setOrgName(user.org_name || "กลุ่มวิสาหกิจชุมชน");
          }
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    };
    loadUser();
  }, []);

  const fetchLedgerData = async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ledger?org_id=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        const formattedData = data
          .filter((item) => parseInt(item.organization_id) === orgId)
          .map((item) => {
            const d = new Date(item.transaction_date);
            return {
              id: item.id,
              date: d.toLocaleDateString("sv-SE"),
              description: item.description,
              category: item.category,
              ref: item.reference_no,
              debit: parseFloat(item.debit) || 0,
              credit: parseFloat(item.credit) || 0,
            };
          });
        setDbEntries(formattedData);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionsData = async () => {
    if (!orgId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/transactions?org_id=${orgId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchLedgerData();
      fetchTransactionsData();
    }
  }, [orgId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedCategories, rowsPerPage, searchQuery]);

  const processedData = useMemo(() => {
    const filtered = dbEntries.filter((row) => {
      const rowDate = row.date;
      const isDateMatch =
        (!startDate || rowDate >= startDate) &&
        (!endDate || rowDate <= endDate);
      const isCategoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(row.category);

      const searchLower = searchQuery.toLowerCase();
      const isSearchMatch =
        !searchQuery ||
        row.description.toLowerCase().includes(searchLower) ||
        (row.ref && row.ref.toLowerCase().includes(searchLower));

      return isDateMatch && isCategoryMatch && isSearchMatch;
    });
    return filtered.sort(
      (a, b) => new Date(a.date) - new Date(b.date) || a.id - b.id,
    );
  }, [dbEntries, startDate, endDate, selectedCategories, searchQuery]);

  const displayData = useMemo(() => {
    let runningBalance = 0;
    const calculated = processedData.map((row) => {
      runningBalance = runningBalance + row.debit - row.credit;
      return { ...row, balance: runningBalance };
    });
    return calculated.reverse();
  }, [processedData]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === "all") return displayData;
    const startIndex = (currentPage - 1) * Number(rowsPerPage);
    return displayData.slice(startIndex, startIndex + Number(rowsPerPage));
  }, [displayData, currentPage, rowsPerPage]);

  const totalPages = useMemo(() => {
    if (rowsPerPage === "all") return 1;
    return Math.ceil(displayData.length / Number(rowsPerPage)) || 1;
  }, [displayData, rowsPerPage]);

  const periodSummary = useMemo(() => {
    return displayData.reduce(
      (acc, row) => ({
        totalIncome: acc.totalIncome + row.debit,
        totalExpense: acc.totalExpense + row.credit,
      }),
      { totalIncome: 0, totalExpense: 0 },
    );
  }, [displayData]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.transaction_date).toLocaleDateString("sv-SE");
      const isAfterStart = !startDate || tDate >= startDate;
      const isBeforeEnd = !endDate || tDate <= endDate;
      return isAfterStart && isBeforeEnd;
    });
  }, [transactions, startDate, endDate]);

  const uniqueProductsSold = useMemo(() => {
    const products = filteredTransactions.map((t) => t.product || t.name);
    return [...new Set(products)].filter(Boolean).sort();
  }, [filteredTransactions]);

  const summaryReport = useMemo(() => {
    const targetData =
      summarySelectedProduct === "all"
        ? filteredTransactions
        : filteredTransactions.filter(
            (t) => (t.product || t.name) === summarySelectedProduct,
          );

    return {
      totalQuantity: targetData.reduce(
        (sum, t) => sum + Number(t.quantity || 1),
        0,
      ),
      totalAmount: targetData.reduce(
        (sum, t) => sum + Number(t.price) * Number(t.quantity || 1),
        0,
      ),
    };
  }, [filteredTransactions, summarySelectedProduct]);

  const openEditModal = (item) => {
    if (
      item.ref &&
      (item.ref.startsWith("ORD-") ||
        item.ref.startsWith("RESTOCK-") ||
        item.ref.startsWith("PROD-"))
    ) {
      return showAlert(
        "แจ้งเตือน",
        "รายการนี้ถูกสร้างโดยระบบอัตโนมัติ ไม่สามารถแก้ไขได้โดยตรง",
        "info",
      );
    }
    setEditId(item.id);
    setIsEditing(true);
    setFormData({
      date: item.date,
      description: item.description,
      category: item.category,
      type: item.debit > 0 ? "income" : "expense",
      amount: item.debit > 0 ? item.debit : item.credit,
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditId(null);
    setIsEditing(false);
    setFormData({
      date: today,
      description: "",
      category: "ทั่วไป",
      type: "income",
      amount: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      return showAlert("แจ้งเตือน", "กรุณากรอกจำนวนเงิน", "warning");
    if (!orgId) return showAlert("Error", "ไม่พบข้อมูลผู้ใช้", "error");

    const payload = {
      organization_id: orgId,
      transaction_date: formData.date,
      description: formData.description,
      category: formData.category,
      debit: formData.type === "income" ? parseFloat(formData.amount) : 0,
      credit: formData.type === "expense" ? parseFloat(formData.amount) : 0,
    };

    if (!isEditing) {
      payload.reference_no = `MAN-${Date.now().toString().slice(-4)}`;
    }

    const url = isEditing
      ? `${API_BASE_URL}/api/ledger/${editId}`
      : `${API_BASE_URL}/api/ledger`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setIsModalOpen(false);
        if (!isEditing && result.id) {
          setNewlyAddedId(result.id);
          setTimeout(() => setNewlyAddedId(null), 5000);
        }
        showAlert(
          "สำเร็จ",
          isEditing ? "แก้ไขข้อมูลเรียบร้อย" : "บันทึกข้อมูลเรียบร้อย",
          "success",
        );
        fetchLedgerData();
      } else {
        const errorData = await res.json();
        showAlert("ผิดพลาด", errorData.message || "บันทึกไม่สำเร็จ", "error");
      }
    } catch (error) {
      showAlert("Connection Error", "ไม่สามารถเชื่อมต่อ Server ได้", "error");
    }
  };

  const deleteRow = (item) => {
    if (
      item.ref &&
      (item.ref.startsWith("ORD-") ||
        item.ref.startsWith("RESTOCK-") ||
        item.ref.startsWith("PROD-"))
    ) {
      return showAlert(
        "แจ้งเตือน",
        "รายการนี้มาจากระบบขาย/สต็อก ไม่สามารถลบจากหน้านี้ได้",
        "warning",
      );
    }

    showConfirm(
      "ยืนยันลบ?",
      "คุณต้องการลบรายการนี้ใช่หรือไม่",
      "warning",
      "ลบเลย",
      async () => {
        closeAlert();
        try {
          const res = await fetch(`${API_BASE_URL}/api/ledger/${item.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showAlert("ลบแล้ว", "รายการถูกลบเรียบร้อย", "success");
            fetchLedgerData();
          }
        } catch (error) {
          console.error(error);
          showAlert("Error", "เกิดข้อผิดพลาดในการลบ", "error");
        }
      },
    );
  };

  const exportToCSV = () => {
    if (displayData.length === 0)
      return showAlert("ไม่มีข้อมูล", "ไม่พบข้อมูลสำหรับส่งออก", "info");
    const headers = [
      "วันที่",
      "รายการ",
      "หมวดหมู่",
      "รายรับ",
      "รายจ่าย",
      "คงเหลือ",
    ];
    const rows = displayData.map((item) => [
      item.date,
      item.description,
      item.category,
      item.debit,
      item.credit,
      item.balance,
    ]);
    let csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Ledger_${orgName}_${startDate || "All"}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatNumber = (num) =>
    num
      ? Number(num).toLocaleString("th-TH", { minimumFractionDigits: 2 })
      : "0.00";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".cat-dropdown")) setIsCatDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white shadow-xl rounded-xl overflow-hidden border border-slate-300 font-sans flex flex-col h-full relative pb-20 md:pb-0">
      <style>{`
        @keyframes flashNew {
          0% { background-color: #ecfdf5; border-left: 4px solid #10b981; }
          100% { background-color: transparent; border-left: 0px solid transparent; }
        }
        .highlight-row { animation: flashNew 5s ease-out forwards; }
      `}</style>

      <div className="px-4 md:px-8 py-6 bg-white border-b-2 border-slate-200">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="p-3 bg-emerald-100 rounded-2xl shadow-sm shrink-0">
              <FileSpreadsheet className="text-emerald-700" size={32} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                สมุดบัญชีแยกประเภท
              </h2>
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  ประเภท: {accountName} ({accountNumber})
                </p>
                {orgName && (
                  <span className="hidden md:inline text-slate-300">|</span>
                )}
                {orgName && (
                  <p className="text-xs md:text-sm text-indigo-600 font-bold flex items-center gap-1">
                    <Building2 size={14} /> {orgName}
                  </p>
                )}
                {isLoading && (
                  <Loader2
                    size={16}
                    className="text-emerald-500 animate-spin"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3">
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="w-full md:w-auto py-2 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <BarChart3 size={16} /> สรุปการขายสินค้า
            </button>

            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden w-full py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <Filter size={16} />{" "}
              {showFiltersMobile ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
            </button>

            <div
              className={`filter-section flex-col md:flex-row flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 relative z-40 ${showFiltersMobile ? "flex" : "hidden md:flex"}`}
            >
              <button
                onClick={() => {
                  if (orgId) {
                    fetchLedgerData();
                    fetchTransactionsData();
                  }
                }}
                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 self-stretch md:self-auto flex justify-center"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>

              <div className="relative w-full md:w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="ค้นหารายการ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm border border-slate-300 outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="relative cat-dropdown w-full md:w-auto">
                <button
                  onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                  className={`w-full md:w-auto flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${selectedCategories.length > 0 ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-white text-slate-600 border-slate-300"}`}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={16} />{" "}
                    {selectedCategories.length === 0
                      ? "ทุกหมวดหมู่"
                      : `${selectedCategories.length} หมวดหมู่`}
                  </div>{" "}
                  <ChevronDown size={14} />
                </button>
                {isCatDropdownOpen && (
                  <div className="absolute top-10 left-0 w-full md:w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1 z-50 max-h-60 overflow-y-auto">
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm hover:bg-slate-50"
                      onClick={() => setSelectedCategories([])}
                    >
                      {selectedCategories.length === 0 && <Check size={14} />}{" "}
                      <span>แสดงทั้งหมด</span>
                    </div>
                    <div className="h-[1px] bg-slate-100 my-1"></div>
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm hover:bg-slate-50"
                        onClick={() =>
                          setSelectedCategories((prev) =>
                            prev.includes(cat)
                              ? prev.filter((c) => c !== cat)
                              : [...prev, cat],
                          )
                        }
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${selectedCategories.includes(cat) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"}`}
                        >
                          {selectedCategories.includes(cat) && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-1 md:border-l md:border-slate-300 md:pl-2 md:ml-1 w-full md:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-600 outline-none h-9 md:h-auto"
                />
                <span className="text-slate-400 hidden md:inline">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-600 outline-none h-9 md:h-auto"
                />
              </div>

              {(startDate ||
                endDate ||
                selectedCategories.length > 0 ||
                searchQuery) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSelectedCategories([]);
                    setSearchQuery("");
                  }}
                  className="w-full md:w-auto px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg font-bold flex items-center justify-center gap-1"
                >
                  <X size={14} /> ล้างค่า
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white min-h-[500px] p-4 md:p-6 overflow-y-auto custom-scrollbar">
        {!orgId ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <Building2 size={64} className="text-slate-200" />
            <p>กรุณาเข้าสู่ระบบเพื่อดูข้อมูลบัญชีของกลุ่ม</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="overflow-x-auto flex-1">
              <table className="w-full border-collapse min-w-[900px] md:min-w-[1200px]">
                <thead>
                  <tr className="text-slate-700 text-xs md:text-sm uppercase tracking-wider bg-slate-100 border-b border-slate-300">
                    <th className="px-2 py-3 border-r w-[100px] md:w-[120px] text-center">
                      ว.ด.ป.
                    </th>
                    <th className="px-4 py-3 border-r text-left">รายการ</th>
                    <th className="px-2 py-3 border-r text-center w-[120px] md:w-[150px]">
                      หมวดหมู่
                    </th>
                    <th className="px-4 py-3 border-r text-right bg-emerald-50 text-emerald-800 w-[120px] md:w-[150px]">
                      รายรับ
                    </th>
                    <th className="px-4 py-3 border-r text-right bg-red-50 text-red-800 w-[120px] md:w-[150px]">
                      รายจ่าย
                    </th>
                    <th className="px-4 py-3 text-right bg-blue-50 text-blue-800 w-[120px] md:w-[150px]">
                      คงเหลือ
                    </th>
                    <th className="w-20 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => {
                    const isAutoEntry =
                      row.ref &&
                      (row.ref.startsWith("ORD-") ||
                        row.ref.startsWith("RESTOCK-") ||
                        row.ref.startsWith("PROD-"));
                    const isNew = row.id === newlyAddedId;

                    // ✅ ค้นหาจำนวนชิ้นจาก Transaction เพื่อนำมาแสดงในตาราง
                    let matchedQty = null;
                    if (row.ref && row.ref.startsWith("ORD-")) {
                      const orderId = row.ref.replace("ORD-", "");
                      // ค้นหาโดยเช็คจาก ID หรือ Reference No
                      const matchedTx = transactions.find(
                        (t) =>
                          String(t.id) === orderId ||
                          t.reference_no === row.ref,
                      );
                      if (matchedTx && matchedTx.quantity) {
                        matchedQty = matchedTx.quantity;
                      }
                    }

                    return (
                      <tr
                        key={row.id || index}
                        className={`hover:bg-slate-50 border-b border-slate-200 text-xs md:text-sm transition-colors ${isNew ? "highlight-row" : ""}`}
                      >
                        <td className="p-2 border-r text-center">
                          {isNew && (
                            <Sparkles
                              size={12}
                              className="inline mr-1 text-amber-500 animate-pulse"
                            />
                          )}
                          {new Date(row.date).toLocaleDateString("th-TH")}
                        </td>
                        <td className="p-2 border-r">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">
                              {row.description}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {isAutoEntry && (
                                <span className="text-[10px] text-slate-400 font-mono italic">
                                  {row.ref}
                                </span>
                              )}

                              {/* ✅ แสดงป้ายบอกจำนวนชิ้น */}
                              {matchedQty && (
                                <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                                  <ShoppingBag size={10} /> ขาย {matchedQty}{" "}
                                  ชิ้น
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 border-r text-center text-[10px] md:text-xs">
                          <span className="px-2 py-1 bg-slate-100 rounded-full border border-slate-200 inline-block truncate max-w-[100px]">
                            {row.category}
                          </span>
                        </td>
                        <td className="p-2 border-r text-right font-mono text-emerald-700 font-bold">
                          {row.debit > 0 ? formatNumber(row.debit) : "-"}
                        </td>
                        <td className="p-2 border-r text-right font-mono text-red-700 font-bold">
                          {row.credit > 0 ? formatNumber(row.credit) : "-"}
                        </td>
                        <td className="p-2 text-right font-mono text-blue-800 font-bold bg-blue-50/30">
                          {formatNumber(row.balance)}
                        </td>
                        <td className="text-center py-2">
                          <div className="flex items-center justify-center gap-2">
                            {isAutoEntry ? (
                              <Lock
                                size={14}
                                className="text-slate-300"
                                title="รายการอัตโนมัติ"
                              />
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditModal(row)}
                                  className="text-slate-400 hover:text-indigo-600 transition-colors bg-slate-100 p-1.5 rounded-lg"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  onClick={() => deleteRow(row)}
                                  className="text-slate-400 hover:text-red-600 transition-colors bg-slate-100 p-1.5 rounded-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {displayData.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-12 text-slate-400"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <FileSpreadsheet size={40} className="opacity-20" />
                          <p>ไม่พบรายการบัญชี</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  แสดงหน้าละ:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={10}>10 รายการ</option>
                  <option value={20}>20 รายการ</option>
                  <option value={50}>50 รายการ</option>
                  <option value="all">ทั้งหมด</option>
                </select>
                <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                  (จากทั้งหมด {displayData.length} รายการ)
                </span>
              </div>

              {rowsPerPage !== "all" && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-500 mr-1">
                      หน้า
                    </span>
                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-100">
                      {currentPage}
                    </span>
                    <span className="text-xs font-bold text-slate-500 mx-1">
                      จาก
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {totalPages}
                    </span>
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={openAddModal}
              className="w-full py-3 mt-4 border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Plus size={20} /> เพิ่มรายการใหม่
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-800 text-white p-4 md:px-8 border-t border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <div className="flex flex-col md:items-start border-b md:border-b-0 md:border-r border-slate-700 pb-2 md:pb-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              รายรับรวม (ตามช่วงเวลา)
            </span>
            <span className="text-lg md:text-xl font-black text-emerald-400">
              ฿{formatNumber(periodSummary.totalIncome)}
            </span>
          </div>
          <div className="flex flex-col md:items-center border-b md:border-b-0 md:border-r border-slate-700 pb-2 md:pb-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              รายจ่ายรวม (ตามช่วงเวลา)
            </span>
            <span className="text-lg md:text-xl font-black text-rose-400">
              ฿{formatNumber(periodSummary.totalExpense)}
            </span>
          </div>
          <div className="flex flex-col md:items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">
              กำไร/ขาดทุน สุทธิ
            </span>
            <span
              className={`text-lg md:text-xl font-black ${periodSummary.totalIncome - periodSummary.totalExpense >= 0 ? "text-blue-400" : "text-red-400"}`}
            >
              ฿
              {formatNumber(
                periodSummary.totalIncome - periodSummary.totalExpense,
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Modal สรุปยอดขาย */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-800">
                <BarChart3 size={20} />
                สรุปยอดขาย (จากออเดอร์)
              </h3>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-indigo-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <p className="text-xs text-slate-500 mb-4">
                * สรุปข้อมูลจากรายการออเดอร์ทั้งหมด ในช่วงวันที่คุณเลือกไว้ (
                {startDate || "เริ่มต้น"} - {endDate || "ปัจจุบัน"})
              </p>

              <label className="block text-sm font-bold text-slate-700 mb-2">
                เลือกสินค้าที่ต้องการดูสรุป
              </label>
              <select
                value={summarySelectedProduct}
                onChange={(e) => setSummarySelectedProduct(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-indigo-500 font-medium text-slate-800 bg-slate-50"
              >
                <option value="all">== ยอดรวมสินค้าทุกประเภท ==</option>
                {uniqueProductsSold.map((productName) => (
                  <option key={productName} value={productName}>
                    {productName}
                  </option>
                ))}
              </select>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                    ยอดเงินรวม
                  </p>
                  <p
                    className="text-2xl font-black text-emerald-700 truncate"
                    title={formatNumber(summaryReport.totalAmount)}
                  >
                    ฿{formatNumber(summaryReport.totalAmount)}
                  </p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                    จำนวนชิ้นที่ขายได้
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <ShoppingBag size={20} className="text-indigo-400" />
                    <p className="text-2xl font-black text-indigo-700">
                      {summaryReport.totalQuantity}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="w-full py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไขรายการบัญชี */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center backdrop-blur-sm p-4 md:p-0">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {isEditing ? (
                  <Edit3 size={20} className="text-indigo-600" />
                ) : (
                  <Plus size={20} className="text-emerald-600" />
                )}
                {isEditing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    ประเภท
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-500"
                  >
                    <option value="income">รายรับ (+)</option>
                    <option value="expense">รายจ่าย (-)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  รายละเอียดรายการ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ค่ารถ, สบู่สมุนไพร"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    จำนวนเงิน (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-emerald-500 font-bold text-right"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`flex-[2] py-2.5 rounded-xl text-white font-bold shadow-md ${isEditing ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                >
                  {isEditing ? "บันทึกการแก้ไข" : "บันทึกรายการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 py-4 bg-slate-50 border-t border-slate-300 flex flex-col md:flex-row justify-end gap-3">
        <button
          onClick={exportToCSV}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm font-bold text-sm"
        >
          <Table size={18} /> Export CSV
        </button>
      </div>

      {customModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-center mb-4">
              {customModal.type === "success" && (
                <CheckCircle2 size={48} className="text-emerald-500" />
              )}
              {customModal.type === "error" && (
                <AlertCircle size={48} className="text-red-500" />
              )}
              {customModal.type === "warning" && (
                <AlertCircle size={48} className="text-amber-500" />
              )}
              {customModal.type === "info" && (
                <Info size={48} className="text-indigo-500" />
              )}
              {customModal.type === "question" && (
                <HelpCircle size={48} className="text-indigo-500" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {customModal.title}
            </h3>
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
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors w-full ${customModal.type === "error" || customModal.type === "warning" ? "bg-red-500 hover:bg-red-600" : customModal.type === "info" || customModal.type === "question" ? "bg-indigo-500 hover:bg-indigo-600" : "bg-emerald-500 hover:bg-emerald-600"}`}
              >
                {customModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
