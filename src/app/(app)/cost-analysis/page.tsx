"use client";

import { useState, useEffect, useCallback } from "react";

type Product = {
  id: number;
  productCode: string;
  name: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  totalStock: number;
};

export default function CostAnalysisPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("margin_desc");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCost, setEditCost] = useState(0);
  const [editSell, setEditSell] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    const res = await fetch(`/api/products?limit=500&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setProducts(
      data.products.map((p: any) => ({
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        unit: p.unit,
        sellingPrice: Number(p.sellingPrice),
        costPrice: Number(p.costPrice),
        totalStock: p.inventory?.reduce((s: number, i: any) => s + i.quantity, 0) || 0,
      }))
    );
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setEditCost(p.costPrice);
    setEditSell(p.sellingPrice);
  }

  async function savePrice(id: number) {
    setSaving(true);
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costPrice: editCost, sellingPrice: editSell }),
    });
    setProducts(products.map((p) =>
      p.id === id ? { ...p, costPrice: editCost, sellingPrice: editSell } : p
    ));
    setEditingId(null);
    setSaving(false);
  }

  // Calculate
  const data = products
    .filter((p) => p.sellingPrice > 0 || p.costPrice > 0)
    .map((p) => {
      const profit = p.sellingPrice - p.costPrice;
      const margin = p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0;
      const stockValue = p.totalStock * p.costPrice;
      const potentialProfit = p.totalStock * profit;
      return { ...p, profit, margin, stockValue, potentialProfit };
    });

  // Sort
  if (sort === "margin_desc") data.sort((a, b) => b.margin - a.margin);
  else if (sort === "margin_asc") data.sort((a, b) => a.margin - b.margin);
  else if (sort === "profit_desc") data.sort((a, b) => b.potentialProfit - a.potentialProfit);
  else if (sort === "cost_desc") data.sort((a, b) => b.costPrice - a.costPrice);
  else if (sort === "stock_value") data.sort((a, b) => b.stockValue - a.stockValue);

  const totalCost = data.reduce((s, d) => s + d.stockValue, 0);
  const totalRevenue = data.reduce((s, d) => s + d.totalStock * d.sellingPrice, 0);
  const totalProfit = data.reduce((s, d) => s + d.potentialProfit, 0);
  const avgMargin = data.length > 0 ? data.reduce((s, d) => s + d.margin, 0) / data.length : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">เปรียบเทียบต้นทุน</h1>
      <p className="text-gray-500 mb-6">วิเคราะห์ราคาซื้อ vs ราคาขาย — คลิกที่แถวเพื่อแก้ไขราคา</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">มูลค่าสต็อค (ทุน)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">฿{Math.round(totalCost).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">มูลค่าขาย (ถ้าขายหมด)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">฿{Math.round(totalRevenue).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">กำไรที่คาดหวัง</p>
          <p className="text-2xl font-bold text-green-600 mt-1">฿{Math.round(totalProfit).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Margin เฉลี่ย</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
        >
          <option value="margin_desc">Margin สูง→ต่ำ</option>
          <option value="margin_asc">Margin ต่ำ→สูง</option>
          <option value="profit_desc">กำไร (สต็อค) สูง→ต่ำ</option>
          <option value="cost_desc">ราคาทุนสูง→ต่ำ</option>
          <option value="stock_value">มูลค่าสต็อคสูง→ต่ำ</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาทุน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาขาย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">กำไร/หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Margin</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">สต็อค</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">กำไรคาดหวัง</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[250px]">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.productCode}</p>
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === d.id ? (
                    <input type="number" value={editCost} onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right px-2 py-1 border border-blue-400 rounded text-sm" autoFocus />
                  ) : (
                    <span className="text-gray-600">฿{d.costPrice.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === d.id ? (
                    <input type="number" value={editSell} onChange={(e) => setEditSell(parseFloat(e.target.value) || 0)}
                      className="w-24 text-right px-2 py-1 border border-blue-400 rounded text-sm" />
                  ) : (
                    <span className="font-medium">฿{d.sellingPrice.toLocaleString()}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === d.id ? (
                    <span className={`font-medium ${(editSell - editCost) > 0 ? "text-green-600" : "text-red-600"}`}>
                      ฿{(editSell - editCost).toLocaleString()}
                    </span>
                  ) : (
                    <span className={d.profit > 0 ? "text-green-600" : "text-red-600"}>
                      {d.profit > 0 ? "+" : ""}฿{d.profit.toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {(() => {
                    const m = editingId === d.id
                      ? (editSell > 0 ? ((editSell - editCost) / editSell * 100) : 0)
                      : d.margin;
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m >= 25 ? "bg-green-100 text-green-700" :
                        m >= 15 ? "bg-yellow-100 text-yellow-700" :
                        m >= 0 ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {m.toFixed(1)}%
                      </span>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{d.totalStock}</td>
                <td className="px-4 py-3 text-right font-medium">
                  <span className={d.potentialProfit > 0 ? "text-green-600" : "text-red-600"}>
                    ฿{Math.round(d.potentialProfit).toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === d.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => savePrice(d.id)} disabled={saving}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50">
                        {saving ? "..." : "บันทึก"}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(d)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs">
                      แก้ไข
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <p className="text-center text-gray-400 py-8">ไม่พบสินค้า</p>
        )}
      </div>
    </div>
  );
}
