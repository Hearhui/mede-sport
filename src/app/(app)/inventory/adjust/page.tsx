"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StockAdjustPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [locationCode, setLocationCode] = useState("หน้าร้าน");
  const [newQty, setNewQty] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function searchProducts(q: string) {
    setSearch(q);
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=8`);
    const data = await res.json();
    setResults(data.products);
  }

  function selectProduct(p: any) {
    setSelected(p);
    setSearch(p.name);
    setResults([]);
    const inv = p.inventory?.find((i: any) => i.location?.code === locationCode);
    setNewQty(inv?.quantity || 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { alert("กรุณาเลือกสินค้า"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selected.id, locationCode, newQuantity: newQty, note }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`ปรับยอดสำเร็จ: ${data.oldQty} → ${data.newQty} (${data.diff > 0 ? "+" : ""}${data.diff})`);
        setSelected(null); setSearch(""); setNote("");
      } else {
        alert(data.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ปรับยอดสต็อค</h1>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">สินค้า</label>
          <input type="text" value={search} onChange={(e) => searchProducts(e.target.value)}
            placeholder="ค้นหาสินค้า..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map((p: any) => (
                <button key={p.id} type="button" onClick={() => selectProduct(p)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">{p.productCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง (Location)</label>
          <input type="text" value={locationCode} onChange={(e) => setLocationCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนใหม่</label>
          <input type="number" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 0)} min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-lg font-bold" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="เหตุผลที่ปรับยอด..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        <button type="submit" disabled={saving || !selected}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : "ปรับยอดสต็อค"}
        </button>
      </form>
    </div>
  );
}
