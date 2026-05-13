"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const categories = ["ค่าเช่า", "ค่าน้ำ-ไฟ", "ค่าขนส่ง", "เงินเดือน", "ค่าวัสดุ", "ค่าการตลาด", "ค่าซ่อมบำรุง", "ค่าโทรศัพท์-อินเทอร์เน็ต", "ค่าประกัน", "อื่นๆ"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [filterCat, setFilterCat] = useState("");

  // Quick add form
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState("อื่นๆ");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function fetchExpenses() {
    const params = new URLSearchParams({ from, to });
    if (filterCat) params.set("category", filterCat);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setTotal(data.total || 0);
  }

  useEffect(() => { fetchExpenses(); }, [from, to, filterCat]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setReceiptUrl(data.url);
    setUploading(false);
  }

  async function handleSave() {
    if (!description || !amount) { alert("กรุณากรอกรายละเอียดและจำนวนเงิน"); return; }
    setSaving(true);
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, category, description, amount, paymentMethod, notes, receiptUrl }),
    });
    setSaving(false);
    setShowForm(false);
    setDescription(""); setAmount(""); setNotes(""); setReceiptUrl("");
    fetchExpenses();
  }

  async function handleDelete(id: number) {
    if (!confirm("ลบรายจ่ายนี้?")) return;
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    fetchExpenses();
  }

  // Group by category for summary
  const catSummary: Record<string, number> = {};
  expenses.forEach((e) => { catSummary[e.category] = (catSummary[e.category] || 0) + Number(e.amount); });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">บันทึกรายจ่าย</h1>
          <p className="text-gray-500 mt-1">บันทึกค่าใช้จ่ายธุรกิจ พร้อมแนบภาพบิล</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium">
          + บันทึกรายจ่าย
        </button>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">บันทึกรายจ่ายใหม่</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">วันที่</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">หมวดหมู่</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">จำนวนเงิน (บาท) *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชำระโดย</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="CASH">เงินสด</option>
                <option value="TRANSFER">โอน</option>
                <option value="CREDIT">เครดิต</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">รายละเอียด *</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="เช่น ค่าเช่าร้านเดือน พ.ค." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">หมายเหตุ</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="(ถ้ามี)" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm cursor-pointer hover:bg-gray-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {uploading ? "กำลังอัปโหลด..." : "แนบภาพบิล"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {receiptUrl && (
              <div className="flex items-center gap-2">
                <img src={receiptUrl} alt="receipt" className="w-12 h-12 rounded object-cover border" />
                <span className="text-xs text-green-600">อัปโหลดแล้ว</span>
              </div>
            )}
            <div className="flex-1" />
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">รวมรายจ่าย</p>
          <p className="text-2xl font-bold text-red-700 mt-1">฿{Math.round(total).toLocaleString()}</p>
          <p className="text-xs text-red-400 mt-1">{expenses.length} รายการ</p>
        </div>
        {Object.entries(catSummary).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, amt]) => (
          <div key={cat} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">{cat}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">฿{Math.round(amt).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รายละเอียด</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">บิล</th>
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{e.category}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{e.description}
                  {e.notes && <span className="text-xs text-gray-400 ml-2">({e.notes})</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold text-red-600">฿{Number(e.amount).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  {e.receiptUrl ? (
                    <a href={e.receiptUrl} target="_blank" className="text-blue-600 hover:underline text-xs">ดูบิล</a>
                  ) : <span className="text-gray-300">-</span>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <p className="text-center text-gray-400 py-8">ไม่มีรายจ่ายในช่วงนี้</p>}
      </div>
    </div>
  );
}
