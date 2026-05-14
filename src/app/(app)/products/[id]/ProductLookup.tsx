"use client";

import { useState } from "react";

type SearchResult = { title: string; snippet: string; url: string };
type ExtractedData = {
  extracted: Record<string, string>;
  description: string;
  relevantText: string[];
};

const fieldLabels: Record<string, string> = {
  material: "วัสดุ",
  weight: "น้ำหนัก",
  size: "ขนาด",
  color: "สี",
  warranty: "การรับประกัน",
  origin: "แหล่งผลิต",
  brand: "แบรนด์",
  description: "รายละเอียด",
};

export default function ProductLookup({
  productId,
  productName,
  productBrand,
}: {
  productId: number;
  productName: string;
  productBrand: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [fetching, setFetching] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  async function handleSearch() {
    setSearching(true);
    setResults([]);
    setExtractedData(null);
    try {
      const q = `${productName} ${productBrand || ""}`.trim();
      const res = await fetch(`/api/products/lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setSearching(false);
    }
  }

  async function handleFetchPage(idx: number, url: string) {
    setFetching(idx);
    setExtractedData(null);
    setApplied(false);
    try {
      const res = await fetch("/api/products/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, productName }),
      });
      const data = await res.json();
      setExtractedData(data);
      // Pre-fill edit fields with extracted data
      const fields: Record<string, string> = {};
      if (data.extracted) {
        Object.entries(data.extracted).forEach(([k, v]) => {
          if (v) fields[k] = v as string;
        });
      }
      if (data.description) fields.description = data.description;
      setEditFields(fields);
    } finally {
      setFetching(null);
    }
  }

  async function handleApply() {
    if (Object.keys(editFields).length === 0) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFields),
      });
      if (res.ok) {
        setApplied(true);
        setTimeout(() => window.location.reload(), 1000);
      }
    } finally {
      setApplying(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); handleSearch(); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium shadow-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        ค้นหารายละเอียดจากเว็บ
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-purple-50 px-4 py-3 flex items-center justify-between border-b border-purple-200">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <h3 className="font-semibold text-purple-900">ค้นหารายละเอียดสินค้าจากอินเทอร์เน็ต</h3>
        </div>
        <button onClick={() => setOpen(false)} className="text-purple-400 hover:text-purple-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {/* Search info */}
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-gray-500">
            ค้นหา: <span className="font-medium text-gray-900">{productName} {productBrand || ""}</span>
          </p>
          <button onClick={handleSearch} disabled={searching}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50">
            {searching ? "กำลังค้นหา..." : "ค้นหาใหม่"}
          </button>
        </div>

        {/* Loading */}
        {searching && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">กำลังค้นหาข้อมูลสินค้า...</span>
          </div>
        )}

        {/* Search Results */}
        {!searching && results.length > 0 && !extractedData && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <p className="text-xs text-gray-400 mb-2">พบ {results.length} ผลลัพธ์ — คลิก "ดึงข้อมูล" เพื่อดึงรายละเอียดจากเว็บไซต์</p>
            {results.map((r, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-blue-700 truncate">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.snippet}</p>
                    <p className="text-[10px] text-gray-300 mt-1 truncate">{r.url}</p>
                  </div>
                  <button
                    onClick={() => handleFetchPage(idx, r.url)}
                    disabled={fetching !== null}
                    className="shrink-0 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50"
                  >
                    {fetching === idx ? (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                        กำลังดึง...
                      </span>
                    ) : "ดึงข้อมูล"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!searching && results.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">ไม่พบผลลัพธ์</p>
        )}

        {/* Extracted Data */}
        {extractedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-sm">ข้อมูลที่ดึงได้</h4>
              <button onClick={() => { setExtractedData(null); setEditFields({}); }}
                className="text-xs text-gray-400 hover:text-gray-600">กลับไปเลือกแหล่งอื่น</button>
            </div>

            {/* Editable extracted fields */}
            {Object.keys(editFields).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(editFields).map(([key, value]) => (
                  <div key={key}>
                    <label className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">{fieldLabels[key] || key}</span>
                      <button onClick={() => {
                        const newFields = { ...editFields };
                        delete newFields[key];
                        setEditFields(newFields);
                      }} className="text-[10px] text-red-400 hover:text-red-600">ไม่ใช้</button>
                    </label>
                    {key === "description" ? (
                      <textarea
                        value={value}
                        onChange={(e) => setEditFields({ ...editFields, [key]: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setEditFields({ ...editFields, [key]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button onClick={handleApply} disabled={applying || applied}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {applied ? "บันทึกแล้ว!" : applying ? "กำลังบันทึก..." : "นำไปใช้กับสินค้า"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4">ไม่สามารถดึงข้อมูลจำเพาะจากหน้านี้ได้ ลองเลือกแหล่งอื่น</p>
            )}

            {/* Relevant text snippets */}
            {extractedData.relevantText && extractedData.relevantText.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">ข้อความที่เกี่ยวข้อง (reference)</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {extractedData.relevantText.map((t, i) => (
                    <p key={i} className="text-xs text-gray-400 leading-relaxed">{t}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
