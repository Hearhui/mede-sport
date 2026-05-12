"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [locationCode, setLocationCode] = useState("หน้าร้าน");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hasVat, setHasVat] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([
    { productId: null, description: "", quantity: 1, unitCost: 0 },
  ]);
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null);

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
    if (!supplierId && !supplierName) { alert("กรุณาระบุ Supplier"); return; }

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
          locationCode,
          date,
          hasVat,
          notes,
          items: validItems,
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
      {/* Supplier + Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลการรับเข้า</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Supplier</label>
            {suppliers.length > 0 ? (
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(parseInt(e.target.value) || "")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="">-- เลือก Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="ชื่อ Supplier"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            )}
            {!supplierId && suppliers.length > 0 && (
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="หรือพิมพ์ชื่อ Supplier ใหม่"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-2"
              />
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">รับเข้าคลัง</label>
            <select
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.code}>{l.code} - {l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">วันที่</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasVat}
                onChange={(e) => setHasVat(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">มี VAT 7% (ภาษีซื้อ)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">รายการสินค้า</h2>
          <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            + เพิ่มรายการ
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-400 mt-3 w-6">{idx + 1}</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า..."
                  value={item.description}
                  onChange={(e) => {
                    updateItem(idx, "description", e.target.value);
                    updateItem(idx, "productId", null);
                    searchProducts(e.target.value, idx);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {searchingIdx === idx && productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {productResults.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProduct(idx, p)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b last:border-0"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-400 ml-2">ทุน ฿{Number(p.costPrice).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                placeholder="จำนวน"
                value={item.quantity || ""}
                onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
              />
              <input
                type="number"
                placeholder="ราคาทุน"
                value={item.unitCost || ""}
                onChange={(e) => updateItem(idx, "unitCost", parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
              />
              <span className="w-28 text-right font-medium text-sm mt-2">
                ฿{(item.unitCost * item.quantity).toLocaleString()}
              </span>
              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 mt-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">รวมเงิน</span>
              <span className="font-medium">฿{subtotal.toLocaleString()}</span>
            </div>
            {hasVat && (
              <div className="flex justify-between">
                <span className="text-gray-500">VAT 7%</span>
                <span className="font-medium">฿{Math.round(vatAmount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-semibold">ยอดรวมสุทธิ</span>
              <span className="font-bold text-blue-600">฿{Math.round(total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm text-gray-600 mb-2">หมายเหตุ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="หมายเหตุ..."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกรับเข้าสินค้า"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
