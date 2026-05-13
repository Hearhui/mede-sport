"use client";

import { useState, useEffect } from "react";

export default function StockCountPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationId, setLocationId] = useState("");
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch(`/api/admin/stock-count${locationId ? `?locationId=${locationId}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        setInventory(d.inventory || []);
        setLocations(d.locations || []);
        // Init counts with current qty
        const c: Record<number, number> = {};
        (d.inventory || []).forEach((i: any) => { c[i.id] = i.quantity; });
        setCounts(c);
      });
  }, [locationId]);

  async function handleSave() {
    const items = Object.entries(counts).map(([id, qty]) => ({
      inventoryId: parseInt(id),
      actualQty: qty,
    }));
    setSaving(true);
    const res = await fetch("/api/admin/stock-count", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    setResult(data.message || data.error);
    setSaving(false);
  }

  const diffCount = inventory.filter((i) => counts[i.id] !== i.quantity).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตรวจนับสต็อค</h1>
          <p className="text-gray-500 mt-1">กรอกจำนวนจริงแล้วกดบันทึก — ระบบจะอัปเดต inventory อัตโนมัติ</p>
        </div>
        <button onClick={handleSave} disabled={saving || diffCount === 0}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? "กำลังบันทึก..." : `บันทึกตรวจนับ (${diffCount} ปรับปรุง)`}
        </button>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-700">{result}</div>
      )}

      {/* Location filter */}
      <div className="mb-6">
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm">
          <option value="">ทุก Location</option>
          {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
        </select>
      </div>

      {/* Stock count table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-28">Location</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">ในระบบ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-36">จำนวนจริง</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 w-28">ผลต่าง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((i: any) => {
              const actual = counts[i.id] ?? i.quantity;
              const diff = actual - i.quantity;
              return (
                <tr key={i.id} className={diff !== 0 ? "bg-yellow-50" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{i.product.name}</p>
                    <p className="text-xs text-gray-400">{i.product.productCode} | {i.product.unit}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{i.location.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{i.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <input type="number" value={actual}
                      onChange={(e) => setCounts({ ...counts, [i.id]: parseInt(e.target.value) || 0 })}
                      className="w-24 text-right px-2 py-1 border border-gray-300 rounded text-sm" min={0} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {diff !== 0 && (
                      <span className={`font-bold ${diff > 0 ? "text-green-600" : "text-red-600"}`}>
                        {diff > 0 ? "+" : ""}{diff}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inventory.length === 0 && <p className="text-center text-gray-400 py-8">ไม่มีสินค้าในคลัง</p>}
      </div>
    </div>
  );
}
