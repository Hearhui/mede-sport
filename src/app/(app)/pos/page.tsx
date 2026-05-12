"use client";

import { useState, useRef, useEffect } from "react";

type CartItem = {
  productId: number;
  productCode: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
};

export default function PosPage() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  async function searchProducts(query: string) {
    setSearch(query);
    if (query.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`);
    const data = await res.json();
    setResults(data.products);
  }

  function addToCart(product: any) {
    const existing = cart.find((c) => c.productId === product.id);
    if (existing) {
      setCart(cart.map((c) => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        productId: product.id,
        productCode: product.productCode,
        name: product.name,
        unit: product.unit,
        unitPrice: Number(product.sellingPrice),
        quantity: 1,
      }]);
    }
    setSearch("");
    setResults([]);
    searchRef.current?.focus();
  }

  function updateQty(productId: number, qty: number) {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.productId !== productId));
    } else {
      setCart(cart.map((c) => c.productId === productId ? { ...c, quantity: qty } : c));
    }
  }

  function updatePrice(productId: number, price: number) {
    setCart(cart.map((c) => c.productId === productId ? { ...c, unitPrice: price } : c));
  }

  function removeFromCart(productId: number) {
    setCart(cart.filter((c) => c.productId !== productId));
  }

  const subtotal = cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
  const total = subtotal - discount;
  const change = cashReceived - total;

  async function checkout() {
    if (cart.length === 0) return;
    if (paymentMethod === "CASH" && cashReceived < total) {
      alert("จำนวนเงินรับไม่เพียงพอ");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({
            productId: c.productId,
            description: c.name,
            unitPrice: c.unitPrice,
            quantity: c.quantity,
          })),
          discount,
          paymentMethod,
          cashReceived: paymentMethod === "CASH" ? cashReceived : total,
        }),
      });

      if (!res.ok) {
        alert("เกิดข้อผิดพลาด");
        return;
      }

      const receipt = await res.json();
      setLastReceipt({ ...receipt, cart: [...cart], discount, total, cashReceived, change: Math.max(0, change) });
      setShowReceipt(true);
      setCart([]);
      setDiscount(0);
      setCashReceived(0);
    } finally {
      setProcessing(false);
    }
  }

  function closeReceipt() {
    setShowReceipt(false);
    setLastReceipt(null);
    searchRef.current?.focus();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-4rem)]">
      {/* Left: Product Search + Results */}
      <div className="flex-1 flex flex-col min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">POS ขายหน้าร้าน</h1>

        {/* Search */}
        <div className="relative mb-4">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => searchProducts(e.target.value)}
            placeholder="ค้นหาสินค้า... (ชื่อ หรือ รหัส)"
            className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            autoFocus
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
              {results.map((p: any) => {
                const totalStock = p.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.productCode} | {p.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">฿{Number(p.sellingPrice).toLocaleString()}</p>
                      <p className={`text-xs ${totalStock <= 2 ? 'text-red-500' : 'text-gray-400'}`}>
                        สต็อค: {totalStock}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick keys - shortcuts */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="text-lg">ค้นหาสินค้าเพื่อเพิ่มในตะกร้า</p>
                <p className="text-sm mt-1">พิมพ์ชื่อหรือรหัสสินค้าในช่องค้นหาด้านบน</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 font-medium text-gray-600">สินค้า</th>
                  <th className="text-right py-2 font-medium text-gray-600 w-28">ราคา</th>
                  <th className="text-center py-2 font-medium text-gray-600 w-32">จำนวน</th>
                  <th className="text-right py-2 font-medium text-gray-600 w-28">รวม</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cart.map((item, idx) => (
                  <tr key={item.productId}>
                    <td className="py-3 text-gray-400">{idx + 1}</td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.productCode}</p>
                    </td>
                    <td className="py-3 text-right">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)}
                        className="w-24 text-right px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 0)}
                          className="w-14 text-center px-1 py-1 border border-gray-200 rounded text-sm"
                        />
                        <button
                          onClick={() => updateQty(item.productId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">
                      ฿{(item.unitPrice * item.quantity).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

      {/* Right: Cart Summary + Payment */}
      <div className="w-full lg:w-80 flex flex-col shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex-1 flex flex-col">
          <h2 className="font-semibold text-gray-900 mb-4">สรุปรายการ</h2>

          <div className="flex-1">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">จำนวนรายการ</span>
                <span className="font-medium">{cart.length} รายการ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">จำนวนชิ้น</span>
                <span className="font-medium">{cart.reduce((s, c) => s + c.quantity, 0)} ชิ้น</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-600">ยอดรวม</span>
                <span className="font-bold">฿{subtotal.toLocaleString()}</span>
              </div>

              <div>
                <label className="text-gray-500 text-xs">ส่วนลด</label>
                <input
                  type="number"
                  value={discount || ""}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right mt-1"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between text-xl border-t border-b py-3 border-gray-200">
                <span className="font-bold text-gray-900">ยอดสุทธิ</span>
                <span className="font-bold text-blue-600">฿{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-sm text-gray-500">ช่องทางชำระเงิน</label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: "CASH", label: "เงินสด" },
                  { value: "TRANSFER", label: "โอน" },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                      paymentMethod === m.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div>
                <label className="text-sm text-gray-500">รับเงิน</label>
                <input
                  type="number"
                  value={cashReceived || ""}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right text-lg font-bold mt-1"
                  placeholder="0"
                />
                {cashReceived > 0 && (
                  <div className="flex justify-between mt-2 text-lg">
                    <span className="text-gray-500">เงินทอน</span>
                    <span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ฿{Math.max(0, change).toLocaleString()}
                    </span>
                  </div>
                )}
                {/* Quick cash buttons */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[total, 100, 500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashReceived(amt)}
                      className="py-1.5 text-xs rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      ฿{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={checkout}
              disabled={cart.length === 0 || processing}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? "กำลังบันทึก..." : "ชำระเงิน"}
            </button>

            {cart.length > 0 && (
              <button
                onClick={() => { setCart([]); setDiscount(0); setCashReceived(0); }}
                className="w-full py-2 text-red-500 hover:text-red-700 text-sm"
              >
                ยกเลิกทั้งหมด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-96 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">ชำระเงินสำเร็จ!</h2>
              <p className="text-gray-500 text-sm mt-1">{lastReceipt.transactionNo}</p>
            </div>

            <div className="border-t border-dashed border-gray-300 py-4 space-y-2 text-sm">
              {lastReceipt.cart.map((item: CartItem, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-600">{item.name} x{item.quantity}</span>
                  <span>฿{(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">รวม</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>
              {lastReceipt.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>ส่วนลด</span>
                  <span>-฿{lastReceipt.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>ยอดสุทธิ</span>
                <span>฿{lastReceipt.total.toLocaleString()}</span>
              </div>
              {paymentMethod === "CASH" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">รับเงิน</span>
                    <span>฿{lastReceipt.cashReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>เงินทอน</span>
                    <span>฿{lastReceipt.change.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={closeReceipt}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              ขายรายการถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
