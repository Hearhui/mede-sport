"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DocItem = {
  id: number;
  itemNo: number;
  description: string;
  quantity: any;
  unitPrice: any;
  amount: any;
};

type BoxItem = {
  documentItemId: number;
  description: string;
  quantity: number;
  maxQuantity: number;
};

type Box = {
  boxNumber: number;
  boxLabel: string;
  weight: string;
  dimensions: string;
  items: BoxItem[];
};

export default function PackingForm({
  document,
}: {
  document: {
    id: number;
    documentNo: string;
    customer: { name: string };
    items: DocItem[];
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [boxes, setBoxes] = useState<Box[]>([
    {
      boxNumber: 1,
      boxLabel: "กล่องที่ 1",
      weight: "",
      dimensions: "",
      items: document.items.map((item) => ({
        documentItemId: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        maxQuantity: Number(item.quantity),
      })),
    },
  ]);

  function addBox() {
    const newBoxNum = boxes.length + 1;
    setBoxes([
      ...boxes,
      {
        boxNumber: newBoxNum,
        boxLabel: `กล่องที่ ${newBoxNum}`,
        weight: "",
        dimensions: "",
        items: document.items.map((item) => ({
          documentItemId: item.id,
          description: item.description,
          quantity: 0,
          maxQuantity: Number(item.quantity),
        })),
      },
    ]);
  }

  function removeBox(idx: number) {
    if (boxes.length <= 1) return;
    const newBoxes = boxes.filter((_, i) => i !== idx);
    newBoxes.forEach((b, i) => {
      b.boxNumber = i + 1;
      b.boxLabel = `กล่องที่ ${i + 1}`;
    });
    setBoxes(newBoxes);
  }

  function updateBox(boxIdx: number, field: string, value: string) {
    const newBoxes = [...boxes];
    (newBoxes[boxIdx] as any)[field] = value;
    setBoxes(newBoxes);
  }

  function updateBoxItemQty(boxIdx: number, itemIdx: number, qty: number) {
    const newBoxes = [...boxes];
    newBoxes[boxIdx].items[itemIdx].quantity = Math.max(0, qty);
    setBoxes(newBoxes);
  }

  // Calculate totals per item across all boxes
  function getItemTotal(documentItemId: number) {
    return boxes.reduce(
      (sum, box) => sum + (box.items.find((i) => i.documentItemId === documentItemId)?.quantity || 0),
      0
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validBoxes = boxes
      .filter((box) => box.items.some((i) => i.quantity > 0))
      .map((box) => ({
        boxNumber: box.boxNumber,
        boxLabel: box.boxLabel,
        weight: box.weight,
        dimensions: box.dimensions,
        items: box.items
          .filter((i) => i.quantity > 0)
          .map((i) => ({ documentItemId: i.documentItemId, quantity: i.quantity })),
      }));

    if (validBoxes.length === 0) {
      alert("กรุณาระบุจำนวนสินค้าในกล่องอย่างน้อย 1 กล่อง");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: document.id,
          notes,
          boxes: validBoxes,
        }),
      });

      if (!res.ok) { alert("เกิดข้อผิดพลาด"); return; }
      const result = await res.json();
      router.push(`/packing/${result.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Document items overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">รายการสินค้าในเอกสาร</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-2 text-gray-600">#</th>
              <th className="text-left py-2 text-gray-600">รายการ</th>
              <th className="text-right py-2 text-gray-600">จำนวนรวม</th>
              <th className="text-right py-2 text-gray-600">จัดแล้ว</th>
              <th className="text-right py-2 text-gray-600">เหลือ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {document.items.map((item) => {
              const packed = getItemTotal(item.id);
              const remaining = Number(item.quantity) - packed;
              return (
                <tr key={item.id}>
                  <td className="py-2 text-gray-400">{item.itemNo}</td>
                  <td className="py-2 font-medium">{item.description}</td>
                  <td className="py-2 text-right">{Number(item.quantity)}</td>
                  <td className="py-2 text-right text-blue-600 font-medium">{packed}</td>
                  <td className={`py-2 text-right font-medium ${remaining > 0 ? 'text-orange-500' : remaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {remaining}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Boxes */}
      {boxes.map((box, boxIdx) => (
        <div key={boxIdx} className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{box.boxNumber}</span>
              </div>
              <input
                type="text"
                value={box.boxLabel}
                onChange={(e) => updateBox(boxIdx, "boxLabel", e.target.value)}
                className="font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none px-1"
              />
            </div>
            {boxes.length > 1 && (
              <button type="button" onClick={() => removeBox(boxIdx)} className="text-red-400 hover:text-red-600 text-sm">
                ลบกล่อง
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500">น้ำหนัก</label>
              <input
                type="text"
                value={box.weight}
                onChange={(e) => updateBox(boxIdx, "weight", e.target.value)}
                placeholder="เช่น 5 kg"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">ขนาด</label>
              <input
                type="text"
                value={box.dimensions}
                onChange={(e) => updateBox(boxIdx, "dimensions", e.target.value)}
                placeholder="เช่น 40x30x25 cm"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mt-1"
              />
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-2 text-gray-600">สินค้า</th>
                <th className="text-right py-2 text-gray-600 w-32">จำนวนในกล่องนี้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {box.items.map((item, itemIdx) => (
                <tr key={item.documentItemId}>
                  <td className="py-2 text-gray-700">{item.description}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      min={0}
                      max={item.maxQuantity}
                      value={item.quantity || ""}
                      onChange={(e) => updateBoxItemQty(boxIdx, itemIdx, parseInt(e.target.value) || 0)}
                      className="w-24 float-right px-2 py-1 border border-gray-300 rounded text-sm text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <button
        type="button"
        onClick={addBox}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
      >
        + เพิ่มกล่อง
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm text-gray-600 mb-2">หมายเหตุ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกใบติดกล่อง"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
