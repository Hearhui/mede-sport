"use client";

import { useState } from "react";

type Props = {
  productId: number;
  costPrice: number;
  lastCostPrice: number;
  avgCostPrice: number;
  sellingPrice: number;
  description: string;
  costMethod: string;
  receiptItems: {
    id: number;
    unitCost: any;
    quantityReceived: number;
    goodsReceipt: { grnNumber: string; date: string; supplier: { name: string } };
  }[];
};

type Source = "JIT" | "AVG" | "CUSTOM";

function detectSource(value: number, jit: number, avg: number): Source {
  if (value === jit && jit > 0) return "JIT";
  if (value === avg && avg > 0) return "AVG";
  return "CUSTOM";
}

export default function CostEditor({ productId, costPrice, lastCostPrice, avgCostPrice, sellingPrice, description, costMethod, receiptItems }: Props) {
  // Cost source
  const [costSrc, setCostSrc] = useState<Source>(detectSource(costPrice, lastCostPrice, avgCostPrice));
  const [customCost, setCustomCost] = useState(costPrice);

  // Selling price source (same pattern)
  const [sellSrc, setSellSrc] = useState<Source>("CUSTOM");
  const [customSelling, setCustomSelling] = useState(sellingPrice);

  const [desc, setDesc] = useState(description || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeCost = costSrc === "JIT" ? lastCostPrice : costSrc === "AVG" ? avgCostPrice : customCost;
  const activeSelling = sellSrc === "JIT" ? lastCostPrice : sellSrc === "AVG" ? avgCostPrice : customSelling;
  const profit = activeSelling - activeCost;
  const margin = activeSelling > 0 ? ((profit / activeSelling) * 100).toFixed(1) : "0";
  const markup = activeCost > 0 ? ((profit / activeCost) * 100).toFixed(1) : "0";

  async function handleSave() {
    setSaving(true);
    const data: any = { costPrice: activeCost, sellingPrice: activeSelling };
    if (desc !== description) data.description = desc;
    await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function PriceSelector({ label, source, setSource, customValue, setCustomValue, color }: {
    label: string; source: Source; setSource: (s: Source) => void;
    customValue: number; setCustomValue: (v: number) => void; color: string;
  }) {
    const activeValue = source === "JIT" ? lastCostPrice : source === "AVG" ? avgCostPrice : customValue;
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <span className={`text-2xl font-bold ${color}`}>฿{activeValue.toLocaleString()}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSource("JIT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${source === "JIT" ? "bg-green-100 text-green-700 ring-2 ring-green-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            ล่าสุด (JIT) ฿{lastCostPrice.toLocaleString()}
          </button>
          <button type="button" onClick={() => setSource("AVG")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${source === "AVG" ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            เฉลี่ย (AVG) ฿{avgCostPrice.toLocaleString()}
          </button>
          <button type="button" onClick={() => setSource("CUSTOM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${source === "CUSTOM" ? "bg-orange-100 text-orange-700 ring-2 ring-orange-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            กำหนดเอง
          </button>
          {source === "CUSTOM" && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-sm text-gray-400">฿</span>
              <input type="number" value={customValue || ""} onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
                className="w-28 px-2 py-1.5 border border-orange-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-orange-300" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cost Selector */}
      <PriceSelector label="ราคาทุน" source={costSrc} setSource={setCostSrc}
        customValue={customCost} setCustomValue={setCustomCost} color="text-gray-900" />

      {/* Selling Price Selector */}
      <PriceSelector label="ราคาขาย" source={sellSrc} setSource={setSellSrc}
        customValue={customSelling} setCustomValue={setCustomSelling} color="text-blue-600" />

      {/* Profit Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">ราคาทุน</p>
            <p className="text-lg font-bold text-gray-900">฿{activeCost.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">{costSrc === "JIT" ? "ล่าสุด" : costSrc === "AVG" ? "เฉลี่ย" : "กำหนดเอง"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ราคาขาย</p>
            <p className="text-lg font-bold text-blue-600">฿{activeSelling.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">{sellSrc === "JIT" ? "ล่าสุด" : sellSrc === "AVG" ? "เฉลี่ย" : "กำหนดเอง"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">กำไร/หน่วย</p>
            <p className={`text-lg font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>฿{profit.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">Margin {margin}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">% กำไร (Markup)</p>
            <p className={`text-lg font-bold ${parseFloat(markup) >= 20 ? "text-green-600" : parseFloat(markup) >= 10 ? "text-yellow-600" : "text-red-600"}`}>
              {markup}%
            </p>
            <p className="text-[10px] text-gray-400">จากต้นทุน</p>
          </div>
        </div>
      </div>

      {/* Save + Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        <div>
          <label className="block text-xs text-gray-500 font-medium mb-1">รายละเอียดสินค้า (ไม่บังคับ)</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="วัสดุ ขนาด สี คุณสมบัติพิเศษ..." />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว" : "บันทึก"}
          </button>
          {saved && <span className="text-sm text-green-600">บันทึกเรียบร้อย</span>}
        </div>
      </div>

      {/* Cost History */}
      {receiptItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3">ประวัติต้นทุนจากการรับสินค้า</h3>
          <div className="space-y-2">
            {receiptItems.map((ri) => (
              <div key={ri.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-mono text-xs text-blue-600">{ri.goodsReceipt.grnNumber}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-gray-500">{new Date(ri.goodsReceipt.date).toLocaleDateString("th-TH")}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-gray-600">{ri.goodsReceipt.supplier.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">฿{Number(ri.unitCost).toLocaleString()}</span>
                  <span className="text-gray-400 text-xs ml-2">x {ri.quantityReceived}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
