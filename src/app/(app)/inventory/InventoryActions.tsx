"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function InventoryActions() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/inventory/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult(`${data.message}${data.errors?.length ? ` (${data.errors.length} errors)` : ""}`);
        router.refresh();
      } else {
        setResult(`Error: ${data.error}`);
      }
    } catch {
      setResult("เกิดข้อผิดพลาด");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-2 items-start">
      {result && (
        <p className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg max-w-xs">{result}</p>
      )}

      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {importing ? "กำลัง Import..." : "Import Excel"}
      </button>

      <a
        href="/api/inventory/export"
        className="inline-flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export Excel
      </a>
    </div>
  );
}
