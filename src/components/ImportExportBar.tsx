"use client";

import { useState, useRef } from "react";

export default function ImportExportBar({
  exportUrl,
  templateUrl,
  importUrl,
  entityName,
}: {
  exportUrl: string;
  templateUrl: string;
  importUrl: string;
  entityName: string;
}) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(importUrl, { method: "POST", body: fd });
    const data = await res.json();
    setResult(data);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={exportUrl} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Excel
      </a>
      <a href={templateUrl} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Template
      </a>
      <label className={`px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer flex items-center gap-1 ${importing ? "opacity-50" : ""}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {importing ? "กำลัง Import..." : "Import Excel"}
        <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" disabled={importing} />
      </label>
      {result && (
        <span className="text-sm ml-2">
          {result.error ? (
            <span className="text-red-600">{result.error}</span>
          ) : (
            <span className="text-green-600">
              สร้างใหม่ {result.created} | อัปเดต {result.updated} | รวม {result.total} {entityName}
              {result.errors?.length > 0 && <span className="text-red-500 ml-1">({result.errors.length} ผิดพลาด)</span>}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
