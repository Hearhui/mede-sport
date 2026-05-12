"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const typeLabels: Record<string, string> = {
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  INVOICE: "ใบกำกับภาษี",
  RECEIPT: "ใบเสร็จรับเงิน",
  DELIVERY_NOTE: "ใบส่งของ",
  CREDIT_NOTE: "ใบลดหนี้",
};

export default function ConvertButton({
  documentId,
  targetType,
  label,
}: {
  documentId: number;
  targetType: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConvert() {
    if (!confirm(`ต้องการ${label}จากเอกสารนี้ใช่หรือไม่?\n\nคุณสามารถแก้ไขรายการได้ภายหลัง`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`เกิดข้อผิดพลาด: ${err.error}`);
        return;
      }

      const newDoc = await res.json();
      router.push(`/documents/${newDoc.id}`);
      router.refresh();
    } catch (e) {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleConvert}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
    >
      {loading ? "กำลังสร้าง..." : label}
    </button>
  );
}
