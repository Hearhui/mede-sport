"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { productId: number | null; description: string; unit: string | null; unitPrice: number; quantity: number };

export default function EditDocumentForm({ document: doc, customers }: { document: any; customers: any[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(doc.customerId);
  const [customerSearch, setCustomerSearch] = useState(doc.customer.name);
  const [paymentTerm, setPaymentTerm] = useState(doc.paymentTerm || "Cash");
  const [vatType, setVatType] = useState(doc.vatType);
  const [showImages, setShowImages] = useState(doc.showImages);
  const [showSignature, setShowSignature] = useState(doc.showSignature ?? true);
  const [discount, setDiscount] = useState(Number(doc.discount) || 0);
  const [deposit, setDeposit] = useState(Number(doc.deposit) || 0);
  const [shippingCost, setShippingCost] = useState(Number(doc.shippingCost) || 0);
  const [notes, setNotes] = useState(doc.notes || "");
  const [status, setStatus] = useState(doc.status);
  const [items, setItems] = useState<Item[]>(
    doc.items.map((i: any) => ({ productId: i.productId, description: i.description, unit: i.unit, unitPrice: Number(i.unitPrice), quantity: Number(i.quantity) }))
  );
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null);

  const filteredCustomers = customerSearch && customerId !== doc.customerId
    ? customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase())).slice(0, 8)
    : [];

  async function searchProducts(query: string, idx: number) {
    if (query.length < 2) { setProductResults([]); return; }
    setSearchingIdx(idx);
    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`);
    const data = await res.json();
    setProductResults(data.products);
  }

  function selectProduct(idx: number, p: any) {
    const n = [...items]; n[idx] = { productId: p.id, description: p.name, unit: p.unit, unitPrice: Number(p.sellingPrice), quantity: 1 }; setItems(n);
    setProductResults([]); setSearchingIdx(null);
  }
  function updateItem(idx: number, f: keyof Item, v: any) { const n = [...items]; (n[idx] as any)[f] = v; setItems(n); }
  function addItem() { setItems([...items, { productId: null, description: "", unit: "อัน", unitPrice: 0, quantity: 1 }]); }
  function removeItem(idx: number) { if (items.length <= 1) return; setItems(items.filter((_, i) => i !== idx)); }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const balanceAfterDiscount = subtotal - discount;
  const vatRate = 7;
  let vatAmount = 0, total = balanceAfterDiscount;
  if (vatType === "EX_VAT") { vatAmount = balanceAfterDiscount * (vatRate / 100); total = balanceAfterDiscount + vatAmount; }
  else if (vatType === "IN_VAT") { vatAmount = balanceAfterDiscount - balanceAfterDiscount / (1 + vatRate / 100); }
  const netBeforeVat = balanceAfterDiscount - vatAmount;
  const grandTotal = total + shippingCost;
  const paymentTotal = grandTotal - deposit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId, paymentTerm, vatType, showImages, showSignature, discount, deposit, shippingCost, notes, status,
          items: items.filter((i) => i.description),
        }),
      });
      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }
      router.push(`/documents/${doc.id}`);
      router.refresh();
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">ลูกค้า</h2>
        <div className="relative">
          <input type="text" value={customerSearch}
            onChange={(e) => { setCustomerSearch(e.target.value); setCustomerId(0); }}
            placeholder="ค้นหาลูกค้า..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          {filteredCustomers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <button key={c.id} type="button" onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-0 text-sm">
                  <span className="font-medium">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">สถานะ</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option value="DRAFT">แบบร่าง</option>
              <option value="SENT">ส่งแล้ว</option>
              <option value="APPROVED">อนุมัติ</option>
              <option value="PAID">ชำระแล้ว</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">เงื่อนไขชำระ</label>
            <select value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option value="Cash">เงินสด</option>
              <option value="15 วัน หลังส่งสินค้า">15 วัน</option>
              <option value="30 วัน หลังส่งสินค้า">30 วัน</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ภาษี</label>
            <select value={vatType} onChange={(e) => setVatType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option value="IN_VAT">รวม VAT 7%</option>
              <option value="EX_VAT">ไม่รวม VAT</option>
              <option value="NO_VAT">ไม่มี VAT</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showImages} onChange={(e) => setShowImages(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-600">แสดงรูป</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showSignature} onChange={(e) => setShowSignature(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-600">แสดงลายเซ็น</span>
            </label>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold text-gray-900">รายการสินค้า</h2>
          <button type="button" onClick={addItem} className="text-blue-600 text-sm font-medium">+ เพิ่มรายการ</button>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-400 mt-3 w-6 text-center">{idx + 1}</span>
              <div className="flex-1 relative">
                <input type="text" value={item.description}
                  onChange={(e) => { updateItem(idx, "description", e.target.value); updateItem(idx, "productId", null); searchProducts(e.target.value, idx); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="ชื่อสินค้า" />
                {searchingIdx === idx && productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {productResults.map((p: any) => (
                      <button key={p.id} type="button" onClick={() => selectProduct(idx, p)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-0">
                        {p.name} <span className="text-gray-400">฿{Number(p.sellingPrice).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="text" value={item.unit || ""} onChange={(e) => updateItem(idx, "unit", e.target.value)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center" />
              <input type="number" value={item.unitPrice || ""} onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right" />
              <input type="number" value={item.quantity || ""} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)} className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right" />
              <span className="w-28 text-right font-semibold text-sm mt-2 tabular-nums">฿{(item.unitPrice * item.quantity).toLocaleString()}</span>
              <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 mt-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <div className="w-80 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ยอดรวมทั้งสิ้น / Sub Total</span>
              <span className="font-medium">฿{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">หักส่วนลด / Discount</span>
              <input type="number" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right" placeholder="0.00" />
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">ยอดคงเหลือ / Balance</span>
                <span className="font-medium">฿{balanceAfterDiscount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">หักเงินมัดจำ / Deposit</span>
              <input type="number" value={deposit || ""} onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right" placeholder="0.00" />
            </div>
            {vatType !== "NO_VAT" && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">มูลค่าสินค้าสุทธิ / Net</span>
                  <span className="font-medium">฿{netBeforeVat.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ภาษีมูลค่าเพิ่ม {vatRate}%</span>
                  <span className="font-medium">฿{vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ยอดรวม / Total</span>
                  <span className="font-medium">฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">ค่าส่งสินค้า / Shipping</span>
              <input type="number" value={shippingCost || ""} onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right" placeholder="0.00" />
            </div>
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-bold">ยอดชำระเงิน</span>
              <span className="font-bold text-blue-600">฿{paymentTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <label className="block text-sm text-gray-600 mb-2">หมายเหตุ</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 shadow-sm">
          {saving ? "กำลังบันทึก..." : "บันทึกเอกสาร"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-8 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">ยกเลิก</button>
      </div>
    </form>
  );
}
