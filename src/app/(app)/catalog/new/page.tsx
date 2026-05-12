"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CatalogItem = {
  productId: number;
  name: string;
  unit: string;
  sellingPrice: number;
  customPrice: number | null;
  isFeatured: boolean;
};

export default function NewCatalogPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [catalogType, setCatalogType] = useState("SHOP");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  async function searchProducts(query: string) {
    setSearch(query);
    if (query.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();
    setResults(data.products.filter((p: any) => !items.some((i) => i.productId === p.id)));
  }

  function addProduct(product: any) {
    setItems([...items, {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      sellingPrice: Number(product.sellingPrice),
      customPrice: null,
      isFeatured: false,
    }]);
    setSearch("");
    setResults([]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateCustomPrice(idx: number, price: number | null) {
    const newItems = [...items];
    newItems[idx].customPrice = price;
    setItems(newItems);
  }

  function toggleFeatured(idx: number) {
    const newItems = [...items];
    newItems[idx].isFeatured = !newItems[idx].isFeatured;
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) { alert("กรุณาใส่ชื่อแคตตาล็อค"); return; }
    if (items.length === 0) { alert("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, catalogType, items }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }
      const catalog = await res.json();
      router.push(`/catalog/${catalog.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างแคตตาล็อคใหม่</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลแคตตาล็อค</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">ชื่อแคตตาล็อค</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="เช่น อุปกรณ์แบดมินตัน 2026"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">ประเภท</label>
              <select value={catalogType} onChange={(e) => setCatalogType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
                <option value="SHOP">แคตตาล็อคร้าน</option>
                <option value="QUOTATION">แคตตาล็อคเสนอราคา</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">รายละเอียด</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="คำอธิบายแคตตาล็อค..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {/* Add products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">เพิ่มสินค้า ({items.length} รายการ)</h2>
          <div className="relative mb-4">
            <input type="text" value={search} onChange={(e) => searchProducts(e.target.value)}
              placeholder="ค้นหาสินค้าเพื่อเพิ่มในแคตตาล็อค..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {results.map((p: any) => (
                  <button key={p.id} type="button" onClick={() => addProduct(p)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 flex justify-between items-center">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-gray-400">฿{Number(p.sellingPrice).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 text-gray-600">#</th>
                  <th className="text-left py-2 text-gray-600">สินค้า</th>
                  <th className="text-right py-2 text-gray-600">ราคาปกติ</th>
                  <th className="text-right py-2 text-gray-600">ราคาพิเศษ</th>
                  <th className="text-center py-2 text-gray-600">แนะนำ</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.productId}>
                    <td className="py-2 text-gray-400">{idx + 1}</td>
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2 text-right text-gray-500">฿{item.sellingPrice.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <input type="number" value={item.customPrice ?? ""}
                        onChange={(e) => updateCustomPrice(idx, e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="เท่าเดิม"
                        className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right" />
                    </td>
                    <td className="py-2 text-center">
                      <input type="checkbox" checked={item.isFeatured} onChange={() => toggleFeatured(idx)} className="rounded" />
                    </td>
                    <td className="py-2">
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "บันทึกแคตตาล็อค"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">ยกเลิก</button>
        </div>
      </form>
    </div>
  );
}
