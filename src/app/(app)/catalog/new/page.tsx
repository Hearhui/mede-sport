"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  productCode: string;
  name: string;
  unit: string;
  sellingPrice: number;
  brand: string | null;
  images: { imageUrl: string }[];
};

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
  const [step, setStep] = useState<1 | 2>(1); // 1=select products, 2=details

  // Catalog details
  const [name, setName] = useState("");
  const [catalogType, setCatalogType] = useState("QUOTATION");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [coverTitle, setCoverTitle] = useState("");
  const [coverSubtitle, setCoverSubtitle] = useState("");
  const [introText, setIntroText] = useState("เราขอนำเสนอสินค้าคุณภาพในราคาที่ดีที่สุดสำหรับท่าน ด้วยประสบการณ์และความเชี่ยวชาญ เรามั่นใจว่าสินค้าทุกชิ้นจะตอบโจทย์ความต้องการของท่านได้อย่างครบถ้วน");
  const [closingText, setClosingText] = useState("หากท่านสนใจหรือต้องการข้อมูลเพิ่มเติม กรุณาติดต่อเราได้ทุกช่องทาง เรายินดีให้บริการเสมอ");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Products + selection
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [items, setItems] = useState<CatalogItem[]>([]);

  // Customers
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=500").then((r) => r.json()).then((d) => setProducts(d.products || []));
    fetch("/api/customers?limit=500").then((r) => r.json()).then((d) => setCustomers(d.customers || d || []));
  }, []);

  function toggleProduct(p: Product) {
    const next = new Set(selected);
    if (next.has(p.id)) {
      next.delete(p.id);
      setItems(items.filter((i) => i.productId !== p.id));
    } else {
      next.add(p.id);
      setItems([...items, {
        productId: p.id, name: p.name, unit: p.unit,
        sellingPrice: p.sellingPrice, customPrice: null, isFeatured: false,
      }]);
    }
    setSelected(next);
  }

  function selectAll() {
    const filtered = filteredProducts;
    const allSelected = filtered.every((p) => selected.has(p.id));
    const next = new Set(selected);
    if (allSelected) {
      filtered.forEach((p) => { next.delete(p.id); });
      setItems(items.filter((i) => !filtered.some((p) => p.id === i.productId)));
    } else {
      const newItems = [...items];
      filtered.forEach((p) => {
        if (!next.has(p.id)) {
          next.add(p.id);
          newItems.push({
            productId: p.id, name: p.name, unit: p.unit,
            sellingPrice: p.sellingPrice, customPrice: null, isFeatured: false,
          });
        }
      });
      setItems(newItems);
    }
    setSelected(next);
  }

  const filteredProducts = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit() {
    if (!name) { alert("กรุณาใส่ชื่อแคตตาล็อค"); return; }
    if (items.length === 0) { alert("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, catalogType, customerId, coverTitle, coverSubtitle,
          introText, closingText, validUntil: validUntil || null, items,
        }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }
      const catalog = await res.json();
      router.push(`/catalog/${catalog.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">สร้างแคตตาล็อคใหม่</h1>
      <p className="text-gray-500 mb-6">
        {step === 1 ? `ขั้นตอน 1: เลือกสินค้า (เลือกแล้ว ${selected.size} รายการ)` : "ขั้นตอน 2: ตั้งค่าแคตตาล็อค"}
      </p>

      {step === 1 && (
        <>
          {/* Search + Select All */}
          <div className="flex gap-4 mb-4">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาสินค้า... (ชื่อ, รหัส, แบรนด์)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
            <button type="button" onClick={selectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              {filteredProducts.every((p) => selected.has(p.id)) ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
          </div>

          {/* Product grid with checkboxes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="w-10 py-3 px-3"></th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600">สินค้า</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600 w-28">แบรนด์</th>
                    <th className="text-right py-3 px-3 font-medium text-gray-600 w-28">ราคาขาย</th>
                    <th className="text-left py-3 px-3 font-medium text-gray-600 w-16">หน่วย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.slice(0, 200).map((p) => (
                    <tr key={p.id}
                      onClick={() => toggleProduct(p)}
                      className={`cursor-pointer transition ${selected.has(p.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                      <td className="py-2 px-3 text-center">
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => {}} className="rounded w-4 h-4" />
                      </td>
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.productCode}</p>
                      </td>
                      <td className="py-2 px-3 text-gray-500">{p.brand || "-"}</td>
                      <td className="py-2 px-3 text-right font-medium">฿{p.sellingPrice.toLocaleString()}</td>
                      <td className="py-2 px-3 text-gray-500">{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected.size > 0 && (
            <button onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 shadow-sm">
              ถัดไป: ตั้งค่าแคตตาล็อค ({selected.size} สินค้า) →
            </button>
          )}
        </>
      )}

      {step === 2 && (
        <div className="space-y-6 max-w-4xl">
          {/* Basic info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลแคตตาล็อค</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">ชื่อแคตตาล็อค *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น แคตตาล็อคสินค้า 2026" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
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

            {/* Customer selection */}
            {catalogType === "QUOTATION" && (
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">ลูกค้า (สำหรับเสนอราคา)</label>
                <select value={customerId || ""} onChange={(e) => setCustomerId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
                  <option value="">-- ไม่ระบุลูกค้า --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">ใช้ได้ถึง</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          {/* Cover & Marketing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">หน้าปก & ข้อความ Marketing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">หัวข้อหน้าปก</label>
                <input type="text" value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)}
                  placeholder="เช่น Product Catalog 2026" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ข้อความรอง</label>
                <input type="text" value={coverSubtitle} onChange={(e) => setCoverSubtitle(e.target.value)}
                  placeholder="เช่น คุณภาพดี ราคาถูก จัดส่งทั่วไทย" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">ข้อความนำเสนอ (อยู่หน้า 2)</label>
              <textarea value={introText} onChange={(e) => setIntroText(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">ข้อความปิดท้าย (หน้าสุดท้าย)</label>
              <textarea value={closingText} onChange={(e) => setClosingText(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          {/* Selected items with pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">สินค้าที่เลือก ({items.length} รายการ)</h2>
            <table className="w-full text-sm">
              <thead className="border-b">
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
                        onChange={(e) => { const n = [...items]; n[idx].customPrice = e.target.value ? parseFloat(e.target.value) : null; setItems(n); }}
                        placeholder="เท่าเดิม" className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right" />
                    </td>
                    <td className="py-2 text-center">
                      <input type="checkbox" checked={item.isFeatured}
                        onChange={() => { const n = [...items]; n[idx].isFeatured = !n[idx].isFeatured; setItems(n); }} className="rounded" />
                    </td>
                    <td className="py-2">
                      <button type="button" onClick={() => { setItems(items.filter((_, i) => i !== idx)); const s = new Set(selected); s.delete(item.productId); setSelected(s); }}
                        className="text-red-400 hover:text-red-600 text-xs">ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(1)}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50">← กลับเลือกสินค้า</button>
            <button onClick={handleSubmit} disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "กำลังบันทึก..." : "สร้างแคตตาล็อค"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
