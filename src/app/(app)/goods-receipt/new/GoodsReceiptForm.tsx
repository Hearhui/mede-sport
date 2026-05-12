"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Item = {
  productId: number | null;
  description: string;
  quantity: number;
  unitCost: number;
};

export default function GoodsReceiptForm({
  suppliers,
  locations,
}: {
  suppliers: { id: number; supplierCode: string; name: string }[];
  locations: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [locationCode, setLocationCode] = useState("หน้าร้าน");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hasVat, setHasVat] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([
    { productId: null, description: "", quantity: 1, unitCost: 0 },
  ]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null);

  const filteredSuppliers = supplierSearch
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        s.supplierCode.toLowerCase().includes(supplierSearch.toLowerCase())
      ).slice(0, 8)
    : suppliers.slice(0, 8);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  async function searchProducts(query: string, idx: number) {
    if (query.length < 2) { setProductResults([]); return; }
    setSearchingIdx(idx);
    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`);
    const data = await res.json();
    setProductResults(data.products);
  }

  function selectProduct(idx: number, product: any) {
    const newItems = [...items];
    newItems[idx] = {
      productId: product.id,
      description: product.name,
      quantity: 1,
      unitCost: Number(product.costPrice),
    };
    setItems(newItems);
    setProductResults([]);
    setSearchingIdx(null);
  }

  function updateItem(idx: number, field: keyof Item, value: any) {
    const newItems = [...items];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { productId: null, description: "", quantity: 1, unitCost: 0 }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const vatAmount = hasVat ? subtotal * 0.07 : 0;
  const total = subtotal + vatAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId && !supplierName) { alert("กรุณาเลือกหรือเพิ่มผู้ขาย (Supplier)"); return; }
    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) { alert("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/goods-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplierId || undefined,
          supplierName: !supplierId ? supplierName : undefined,
          locationCode, date, hasVat, notes, items: validItems,
        }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }
      router.push("/goods-receipt");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Supplier Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">ผู้ขาย (Supplier / Vendor)</h2>
        </div>

        {selectedSupplier ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-green-800">{selectedSupplier.name}</p>
              <p className="text-xs text-green-600">{selectedSupplier.supplierCode}</p>
            </div>
            <button type="button" onClick={() => { setSupplierId(""); setSupplierSearch(""); }}
              className="text-green-600 hover:text-green-800 text-sm underline">เปลี่ยน</button>
          </div>
        ) : showNewSupplier ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 font-medium">เพิ่มผู้ขายใหม่</p>
            </div>
            <input type="text" value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
              placeholder="ชื่อบริษัท/ร้านค้าผู้ขาย" required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="button" onClick={() => { setShowNewSupplier(false); setSupplierName(""); }}
              className="text-gray-500 hover:text-gray-700 text-sm underline">← กลับเลือกผู้ขายเดิม</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input type="text" value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="ค้นหาผู้ขาย..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredSuppliers.map((s) => (
                <button key={s.id} type="button" onClick={() => setSupplierId(s.id)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.supplierCode}</p>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setShowNewSupplier(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มผู้ขายใหม่
              </button>
              <Link href="/suppliers/new" className="text-gray-400 hover:text-gray-600 text-xs underline" target="_blank">
                หรือไปหน้าจัดการผู้ขาย →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลการรับเข้า</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">วันที่รับเข้า</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">รับเข้าคลัง</label>
            <select value={locationCode} onChange={(e) => setLocationCode(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm">
              {locations.map((l) => (
                <option key={l.id} value={l.code}>{l.code}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 w-full">
              <input type="checkbox" checked={hasVat} onChange={(e) => setHasVat(e.target.checked)}
                className="rounded text-blue-600 w-5 h-5" />
              <div>
                <span className="text-sm text-gray-700 font-medium">มี VAT 7%</span>
                <p className="text-xs text-gray-400">ภาษีซื้อ</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">รายการสินค้ารับเข้า</h2>
          <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ เพิ่มรายการ</button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-sm text-gray-400 mt-2.5 w-6 text-center font-medium">{idx + 1}</span>
              <div className="flex-1 relative">
                <input type="text" placeholder="ค้นหาสินค้า..." value={item.description}
                  onChange={(e) => { updateItem(idx, "description", e.target.value); updateItem(idx, "productId", null); searchProducts(e.target.value, idx); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                {searchingIdx === idx && productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {productResults.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => selectProduct(idx, p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b last:border-0 flex justify-between">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-400">ทุน ฿{Number(p.costPrice).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <input type="number" placeholder="จำนวน" value={item.quantity || ""}
                  onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                  className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-right" />
              </div>
              <div>
                <input type="number" placeholder="ราคาทุน" value={item.unitCost || ""}
                  onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                  className="w-28 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-right" />
              </div>
              <span className="w-28 text-right font-semibold text-sm mt-2.5 tabular-nums">
                ฿{(item.unitCost * item.quantity).toLocaleString()}
              </span>
              <button type="button" onClick={() => removeItem(idx)}
                className="text-gray-300 hover:text-red-500 mt-2.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-80 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">รวมเงิน</span><span className="font-medium tabular-nums">฿{subtotal.toLocaleString()}</span></div>
            {hasVat && <div className="flex justify-between"><span className="text-gray-500">VAT 7%</span><span className="font-medium tabular-nums">฿{Math.round(vatAmount).toLocaleString()}</span></div>}
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-bold">ยอดรวมสุทธิ</span>
              <span className="font-bold text-blue-600 tabular-nums">฿{Math.round(total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm text-gray-600 mb-2">หมายเหตุ</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="เลขที่ใบกำกับภาษีซื้อ, หมายเหตุอื่นๆ..." />
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={saving}
          className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 shadow-sm transition-colors">
          {saving ? "กำลังบันทึก..." : "บันทึกรับเข้าสินค้า"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-8 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">ยกเลิก</button>
      </div>
    </form>
  );
}
