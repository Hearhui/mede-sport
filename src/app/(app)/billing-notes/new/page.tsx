"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Invoice = { id: number; documentNo: string; total: number; customer: { id: number; name: string }; date: string };

export default function NewBillingNotePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (customerSearch.length >= 2) {
      fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=8`)
        .then((r) => r.json()).then((d) => setCustomers(d.customers));
    }
  }, [customerSearch]);

  useEffect(() => {
    if (customerId) {
      fetch(`/api/documents?type=INVOICE&limit=50`)
        .then((r) => r.json()).then((d) => {
          setInvoices(d.documents.filter((doc: any) => doc.customerId === customerId));
        });
    }
  }, [customerId]);

  function toggleInvoice(id: number) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  const totalAmount = invoices.filter((i) => selectedIds.includes(i.id)).reduce((s, i) => s + Number(i.total), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || selectedIds.length === 0) { alert("กรุณาเลือกลูกค้าและ Invoice อย่างน้อย 1 รายการ"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/billing-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, date, dueDate: dueDate || null, notes, documentIds: selectedIds }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }
      router.push("/billing-notes");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างใบวางบิลใหม่</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">เลือกลูกค้า</h2>
          <div className="relative">
            <input type="text" value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(""); setSelectedIds([]); }}
              placeholder="ค้นหาลูกค้า..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            {customerSearch && !customerId && customers.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customers.map((c: any) => (
                  <button key={c.id} type="button" onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{c.customerCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {customerId && <p className="text-green-600 text-sm mt-2">เลือกแล้ว: {customerSearch}</p>}
        </div>

        {/* Select Invoices */}
        {customerId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">เลือก Invoice ที่จะวางบิล</h2>
            {invoices.length === 0 ? (
              <p className="text-gray-400 text-center py-4">ไม่พบ Invoice ของลูกค้านี้</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <label key={inv.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedIds.includes(inv.id) ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedIds.includes(inv.id)}
                        onChange={() => toggleInvoice(inv.id)} className="rounded text-blue-600 w-5 h-5" />
                      <div>
                        <p className="font-medium text-gray-900">{inv.documentNo}</p>
                        <p className="text-xs text-gray-400">{new Date(inv.date).toLocaleDateString("th-TH")}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">฿{Number(inv.total).toLocaleString()}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedIds.length > 0 && (
              <div className="mt-4 pt-4 border-t flex justify-between text-lg">
                <span className="font-bold">{selectedIds.length} Invoice</span>
                <span className="font-bold text-blue-600">ยอดรวม ฿{totalAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">วันที่วางบิล</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ครบกำหนดชำระ</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">หมายเหตุ</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 shadow-sm">
            {saving ? "กำลังบันทึก..." : "สร้างใบวางบิล"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-8 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">ยกเลิก</button>
        </div>
      </form>
    </div>
  );
}
