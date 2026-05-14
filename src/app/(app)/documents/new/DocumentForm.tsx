"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Customer = { id: number; customerCode: string; name: string };
type Item = {
  productId: number | null;
  itemType: "product" | "service";
  description: string;
  unit: string;
  unitPrice: number;
  quantity: number;
};

export default function DocumentForm({
  customers,
}: {
  customers: Customer[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentTerm, setPaymentTerm] = useState("Cash");
  const [vatType, setVatType] = useState("IN_VAT");
  const [showImages, setShowImages] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([
    { productId: null, itemType: "product", description: "", unit: "อัน", unitPrice: 0, quantity: 1 },
  ]);

  // Product search
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingIdx, setSearchingIdx] = useState<number | null>(null);

  async function searchProducts(query: string, idx: number) {
    if (query.length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingIdx(idx);
    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
    const data = await res.json();
    setProductResults(data.products);
  }

  function selectProduct(idx: number, product: any) {
    const newItems = [...items];
    newItems[idx] = {
      productId: product.id,
      itemType: "product",
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

  function addItem(type: "product" | "service" = "product") {
    setItems([...items, {
      productId: null, itemType: type, description: "",
      unit: type === "service" ? "งาน" : "อัน", unitPrice: 0, quantity: 1,
    }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const balanceAfterDiscount = subtotal - discount;
  const vatRate = 7;
  let vatAmount = 0;
  let total = balanceAfterDiscount;
  if (vatType === "EX_VAT") {
    vatAmount = balanceAfterDiscount * (vatRate / 100);
    total = balanceAfterDiscount + vatAmount;
  } else if (vatType === "IN_VAT") {
    vatAmount = balanceAfterDiscount - balanceAfterDiscount / (1 + vatRate / 100);
  }
  const netBeforeVat = balanceAfterDiscount - vatAmount;
  const grandTotal = total + shippingCost;
  const paymentTotal = grandTotal - deposit;

  async function createNewCustomer() {
    if (!newCustName.trim()) return;
    setCreatingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCustName, phone: newCustPhone, addressLine1: newCustAddress }),
      });
      if (res.ok) {
        const cust = await res.json();
        customers.push({ id: cust.id, customerCode: cust.customerCode, name: cust.name });
        setCustomerId(cust.id);
        setCustomerSearch(cust.name);
        setShowNewCustomer(false);
        setNewCustName(""); setNewCustPhone(""); setNewCustAddress("");
      }
    } finally {
      setCreatingCustomer(false);
    }
  }

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.customerCode.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      alert("กรุณาเลือกลูกค้า");
      return;
    }
    if (items.every((i) => !i.description)) {
      alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "QUOTATION",
          customerId,
          date,
          paymentTerm,
          vatType,
          showImages,
          discount,
          deposit,
          shippingCost,
          notes,
          items: items.filter((i) => i.description),
        }),
      });

      if (!res.ok) {
        alert("เกิดข้อผิดพลาด");
        return;
      }

      const doc = await res.json();
      router.push(`/documents/${doc.id}`);
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลลูกค้า</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="พิมพ์ชื่อลูกค้า..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCustomerId("");
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {customerSearch && !customerId && filteredCustomers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCustomerId(c.id);
                    setCustomerSearch(c.name);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-400 text-xs ml-2">{c.customerCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {customerId && (
          <p className="text-green-600 text-sm mt-2">
            เลือกแล้ว: {customers.find((c) => c.id === customerId)?.name}
            <button type="button" onClick={() => { setCustomerId(""); setCustomerSearch(""); }} className="text-gray-400 hover:text-red-500 ml-2 text-xs">เปลี่ยน</button>
          </p>
        )}

        {/* Add new customer */}
        {!customerId && (
          <div className="mt-3">
            {!showNewCustomer ? (
              <button type="button" onClick={() => setShowNewCustomer(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ เพิ่มลูกค้าใหม่</button>
            ) : (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-3">
                <p className="text-sm font-medium text-blue-800">ลูกค้าใหม่</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="text" value={newCustName} onChange={e => setNewCustName(e.target.value)}
                    placeholder="ชื่อลูกค้า *" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="text" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="เบอร์โทร" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="text" value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)}
                    placeholder="ที่อยู่" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={createNewCustomer} disabled={!newCustName.trim() || creatingCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {creatingCustomer ? "กำลังสร้าง..." : "สร้างลูกค้า"}
                  </button>
                  <button type="button" onClick={() => setShowNewCustomer(false)}
                    className="px-4 py-2 text-gray-500 text-sm">ยกเลิก</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลเอกสาร</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">วันที่</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">เงื่อนไขชำระเงิน</label>
            <select
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="Cash">เงินสด</option>
              <option value="15 วัน หลังส่งสินค้า">15 วัน</option>
              <option value="30 วัน หลังส่งสินค้า">30 วัน</option>
              <option value="60 วัน หลังส่งสินค้า">60 วัน</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">ภาษี</label>
            <select
              value={vatType}
              onChange={(e) => setVatType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="IN_VAT">รวม VAT 7%</option>
              <option value="EX_VAT">ไม่รวม VAT (บวก 7%)</option>
              <option value="NO_VAT">ไม่มี VAT</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showImages}
                onChange={(e) => setShowImages(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">แสดงรูปสินค้า</span>
            </label>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">รายการสินค้า / บริการ</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => addItem("product")}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium">+ สินค้า</button>
            <button type="button" onClick={() => addItem("service")}
              className="text-green-600 hover:text-green-700 text-sm font-medium">+ บริการ</button>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${item.itemType === "service" ? "bg-green-50" : "bg-gray-50"}`}>
              {/* Mobile: item number badge */}
              <div className="flex items-center justify-between sm:hidden mb-2">
                <span className={`text-xs px-2 py-0.5 rounded ${item.itemType === "service" ? "bg-green-200 text-green-700" : "bg-blue-100 text-blue-600"}`}>
                  #{idx + 1} {item.itemType === "service" ? "บริการ" : "สินค้า"}
                </span>
                <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Desktop row / Mobile stacked */}
              <div className="flex gap-3 items-start">
                <div className="mt-3 w-6 text-center hidden sm:block">
                  <span className="text-xs text-gray-400">{idx + 1}</span>
                  <span className={`block text-[9px] mt-0.5 ${item.itemType === "service" ? "text-green-600" : "text-blue-500"}`}>
                    {item.itemType === "service" ? "บริการ" : "สินค้า"}
                  </span>
                </div>
                <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-start">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={item.itemType === "service" ? "รายละเอียดบริการ (พิมพ์ได้อิสระ)" : "ชื่อสินค้า (พิมพ์เพื่อค้นหาจาก stock หรือพิมพ์ใหม่)"}
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
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-gray-400 ml-2">฿{Number(p.sellingPrice).toLocaleString()}/{p.unit}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder="หน่วย"
                      value={item.unit}
                      onChange={(e) => updateItem(idx, "unit", e.target.value)}
                      className="w-16 sm:w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                    />
                    <input
                      type="number"
                      placeholder="ราคา"
                      value={item.unitPrice || ""}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="flex-1 sm:flex-none sm:w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                    />
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 0)}
                      className="w-16 sm:w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="sm:w-28 text-right font-medium text-sm sm:mt-2">
                      ฿{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600 sm:mt-2 hidden sm:block"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-80 space-y-2 text-sm">
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

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm text-gray-600 mb-2">หมายเหตุ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="หมายเหตุเพิ่มเติม..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกใบเสนอราคา"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
