"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  productId: number | null;
  description: string;
  unit: string | null;
  unitPrice: number;
  quantity: number;
};

const typeLabels: Record<string, string> = {
  PURCHASE_ORDER: "ใบสั่งซื้อ", INVOICE: "ใบกำกับภาษี",
  RECEIPT: "ใบเสร็จรับเงิน", DELIVERY_NOTE: "ใบส่งของ", CREDIT_NOTE: "ใบลดหนี้",
};

export default function ConvertForm({
  sourceDocument,
  targetType,
  customerMissingFields = [],
}: {
  sourceDocument: any;
  targetType: string;
  customerMissingFields?: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [paymentTerm, setPaymentTerm] = useState(sourceDocument.paymentTerm || "Cash");
  const [vatType, setVatType] = useState(sourceDocument.vatType);
  const [showImages, setShowImages] = useState(sourceDocument.showImages);
  const [showSignature, setShowSignature] = useState(sourceDocument.showSignature ?? true);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>(
    sourceDocument.items.map((i: any) => ({
      productId: i.productId,
      description: i.description,
      unit: i.unit,
      unitPrice: Number(i.unitPrice),
      quantity: Number(i.quantity),
    }))
  );

  // Product search
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
      unit: product.unit,
      unitPrice: Number(product.sellingPrice),
      quantity: 1,
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
    setItems([...items, { productId: null, description: "", unit: "อัน", unitPrice: 0, quantity: 1 }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const vatRate = 7;
  let vatAmount = 0;
  let total = subtotal;
  if (vatType === "EX_VAT") { vatAmount = subtotal * (vatRate / 100); total = subtotal + vatAmount; }
  else if (vatType === "IN_VAT") { vatAmount = subtotal - subtotal / (1 + vatRate / 100); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (customerMissingFields.length > 0) {
      alert(`กรุณาเพิ่มข้อมูลลูกค้าให้ครบก่อน: ${customerMissingFields.join(", ")}`);
      return;
    }
    const validItems = items.filter((i) => i.description);
    if (validItems.length === 0) { alert("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${sourceDocument.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          items: validItems,
          paymentTerm,
          vatType,
          showImages,
          showSignature,
          notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
        return;
      }

      const newDoc = await res.json();
      router.push(`/documents/${newDoc.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          กำลังสร้าง <strong>{typeLabels[targetType]}</strong> จาก {sourceDocument.documentNo} — คุณสามารถ <strong>เพิ่ม ลด แก้ไข</strong> รายการได้ก่อนบันทึก
        </p>
      </div>

      {/* Document settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">ตั้งค่าเอกสาร</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">เงื่อนไขชำระ</label>
            <select value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option value="Cash">เงินสด</option>
              <option value="15 วัน หลังส่งสินค้า">15 วัน</option>
              <option value="30 วัน หลังส่งสินค้า">30 วัน</option>
              <option value="60 วัน หลังส่งสินค้า">60 วัน</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ภาษี</label>
            <select value={vatType} onChange={(e) => setVatType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option value="IN_VAT">รวม VAT 7%</option>
              <option value="EX_VAT">ไม่รวม VAT (บวก 7%)</option>
              <option value="NO_VAT">ไม่มี VAT</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showImages} onChange={(e) => setShowImages(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-600">แสดงรูปสินค้า</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showSignature} onChange={(e) => setShowSignature(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-600">แสดงลายเซ็น</span>
            </label>
          </div>
        </div>
      </div>

      {/* Items — editable */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">รายการสินค้า ({items.length} รายการ)</h2>
          <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ เพิ่มรายการ</button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-400 mt-3 w-6 text-center">{idx + 1}</span>
              <div className="flex-1 relative">
                <input type="text" placeholder="ชื่อสินค้า (พิมพ์เพื่อค้นหา หรือพิมพ์ใหม่)"
                  value={item.description}
                  onChange={(e) => { updateItem(idx, "description", e.target.value); updateItem(idx, "productId", null); searchProducts(e.target.value, idx); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                {searchingIdx === idx && productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {productResults.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => selectProduct(idx, p)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-0">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-400 ml-2">฿{Number(p.sellingPrice).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="text" placeholder="หน่วย" value={item.unit || ""}
                onChange={(e) => updateItem(idx, "unit", e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center" />
              <input type="number" placeholder="ราคา" value={item.unitPrice || ""}
                onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right" />
              <input type="number" placeholder="จำนวน" value={item.quantity || ""}
                onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right" />
              <span className="w-28 text-right font-semibold text-sm mt-2 tabular-nums">
                ฿{(item.unitPrice * item.quantity).toLocaleString()}
              </span>
              <button type="button" onClick={() => removeItem(idx)}
                className="text-gray-300 hover:text-red-500 mt-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">รวมเงิน</span><span className="font-medium tabular-nums">฿{subtotal.toLocaleString()}</span></div>
            {vatType !== "NO_VAT" && (
              <div className="flex justify-between"><span className="text-gray-500">VAT {vatRate}%</span><span className="font-medium tabular-nums">฿{Math.round(vatAmount).toLocaleString()}</span></div>
            )}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="หมายเหตุเพิ่มเติม..." />
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={saving || customerMissingFields.length > 0}
          className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 shadow-sm">
          {customerMissingFields.length > 0 ? "ข้อมูลลูกค้าไม่ครบ" : saving ? "กำลังบันทึก..." : `บันทึก${typeLabels[targetType]}`}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-8 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">ยกเลิก</button>
      </div>
    </form>
  );
}
