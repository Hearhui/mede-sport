"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({
  apiUrl,
  itemName,
  redirectUrl,
  size,
}: {
  apiUrl: string;
  itemName: string;
  redirectUrl?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`ต้องการลบ "${itemName}" ใช่หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;

    setDeleting(true);
    try {
      const res = await fetch(apiUrl, { method: "DELETE" });
      if (res.ok) {
        if (redirectUrl) {
          router.push(redirectUrl);
        }
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "ไม่สามารถลบได้ (อาจมีข้อมูลอ้างอิงอยู่)");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={`text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors ${
        size === "md" ? "px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-sm" : ""
      }`}
      title={`ลบ ${itemName}`}
    >
      {deleting ? "..." : size === "md" ? "ลบ" : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}
