import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Edit3,
  Trash2,
  Shield,
  Save,
  X,
  Key,
  Building2,
  User,
  Loader2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

export default function AdminDashboard({ onSwitchUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ กำหนด URL ของ Backend (ตอนนำขึ้น Server จริง ให้ตั้งเป็น IP ของ Server หรือปล่อยว่างถ้าใช้ Proxy)
  const API_BASE_URL = "https://communitybi.sru.ac.th";

  // Modal State สำหรับแก้ไขผู้ใช้
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    org_name: "",
    password: "", 
  });

  // Custom Alert Modal State
  const [customModal, setCustomModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "info", // "success", "error", "warning", "info"
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      showAlert("ผิดพลาด", "โหลดข้อมูลไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      org_name: user.org_name,
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (res.ok) {
        setIsModalOpen(false);
        showAlert("สำเร็จ", "แก้ไขข้อมูลเรียบร้อย", "success");
        fetchUsers();
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      showAlert("ผิดพลาด", "บันทึกข้อมูลไม่สำเร็จ", "error");
    }
  };

  const handleDelete = (id) => {
    showConfirm(
      "แน่ใจหรือไม่?",
      "การลบผู้ใช้จะไม่สามารถกู้คืนได้!",
      "warning",
      "ลบเลย",
      async () => {
        closeAlert();
        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showAlert("ลบแล้ว!", "ผู้ใช้งานถูกลบเรียบร้อย", "success");
            fetchUsers();
          } else {
            throw new Error("Delete failed");
          }
        } catch (error) {
          showAlert("ผิดพลาด", "ลบไม่สำเร็จ", "error");
        }
      }
    );
  };

  const handleViewUser = (user) => {
    showConfirm(
      `เข้าดูร้าน "${user.org_name}"?`,
      "คุณกำลังจะสลับไปใช้งานในฐานะผู้ใช้นี้",
      "info",
      "ใช่, เข้าดูเลย",
      () => {
        closeAlert();
        if (onSwitchUser) {
          onSwitchUser(user);
        }
      }
    );
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.org_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" size={48} />
        <p className="mt-4">กำลังโหลดข้อมูลผู้ดูแลระบบ...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="text-indigo-600" size={32} /> จัดการผู้ใช้งานระบบ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Admin Panel: จัดการรหัสผ่านและชื่อวิสาหกิจ
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือ วิสาหกิจ..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 border-b border-slate-200">ID</th>
                <th className="p-4 border-b border-slate-200">
                  ชื่อผู้ใช้งาน (Username)
                </th>
                <th className="p-4 border-b border-slate-200">
                  ชื่อวิสาหกิจ (Organization)
                </th>
                <th className="p-4 border-b border-slate-200 text-center">
                  สถานะ
                </th>
                <th className="p-4 border-b border-slate-200 text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4 text-slate-500 font-mono text-xs">
                    #{user.id}
                  </td>
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <span className="truncate">{user.username}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate">{user.org_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${user.role === "Admin" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                        title="เข้าสู่ระบบเป็นร้านนี้"
                      >
                        <Eye size={18} />
                      </button>

                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                        title="แก้ไข / เปลี่ยนรหัสผ่าน"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
                        title="ลบผู้ใช้"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Edit Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit3 size={24} className="text-indigo-600" />{" "}
                แก้ไขข้อมูลผู้ใช้
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ชื่อวิสาหกิจ (Enterprise Name)
                </label>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.org_name}
                    onChange={(e) =>
                      setFormData({ ...formData, org_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-bold text-red-600 mb-1 flex items-center gap-1">
                  <Key size={16} /> เปลี่ยนรหัสผ่านใหม่ (ถ้าต้องการ)
                </label>
                <input
                  type="text"
                  placeholder="กรอกรหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)"
                  className="w-full px-4 py-2 border border-red-200 bg-red-50 text-red-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none placeholder:text-red-300"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400 mt-1">
                  * หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นช่องนี้ว่างไว้
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Custom Alert/Confirm Modal --- */}
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
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors w-full ${
                  customModal.type === 'error' || customModal.type === 'warning' 
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