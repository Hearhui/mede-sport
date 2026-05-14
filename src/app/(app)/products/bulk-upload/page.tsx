"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Product = { id: number; name: string; productCode: string; brand: string | null };
type FileItem = {
  file: File;
  preview: string;
  productId: number | null;
  productName: string;
  status: "pending" | "uploading" | "done" | "error";
};

export default function BulkUploadPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);
  const [search, setSearch] = useState<Record<number, string>>({});
  const [dropdowns, setDropdowns] = useState<Record<number, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=2000").then(r => r.json()).then(d => setProducts(d.products || []));
  }, []);

  function autoMatch(fileName: string): Product | null {
    // Remove extension: "Molten F5N1000.jpg" → "Molten F5N1000"
    const name = fileName.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim().toLowerCase();
    if (!name) return null;

    // Try exact match on productCode first
    let match = products.find(p => p.productCode.toLowerCase() === name);
    if (match) return match;

    // Try filename contains productCode or vice versa
    match = products.find(p => name.includes(p.productCode.toLowerCase()));
    if (match) return match;

    // Try filename matches product name (partial)
    const words = name.split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 0) {
      // Score each product by how many words match
      let bestScore = 0;
      let bestProduct: Product | null = null;
      for (const p of products) {
        const pName = p.name.toLowerCase();
        const pBrand = (p.brand || "").toLowerCase();
        let score = 0;
        for (const w of words) {
          if (pName.includes(w)) score += 2;
          if (pBrand.includes(w)) score += 1;
        }
        if (score > bestScore && score >= 2) {
          bestScore = score;
          bestProduct = p;
        }
      }
      if (bestProduct) return bestProduct;
    }
    return null;
  }

  function addFiles(newFiles: FileList | File[]) {
    const items: FileItem[] = Array.from(newFiles)
      .filter(f => f.type.startsWith("image/"))
      .map(f => {
        const matched = autoMatch(f.name);
        return {
          file: f,
          preview: URL.createObjectURL(f),
          productId: matched?.id || null,
          productName: matched?.name || "",
          status: "pending" as const,
        };
      });

    const matchedCount = items.filter(i => i.productId).length;
    if (matchedCount > 0) {
      alert(`จับคู่อัตโนมัติได้ ${matchedCount}/${items.length} รูป! ตรวจสอบแล้วกด Upload`);
    }

    setFiles(prev => [...prev, ...items]);
  }

  function assignProduct(fileIdx: number, product: Product) {
    setFiles(prev => prev.map((f, i) => i === fileIdx ? { ...f, productId: product.id, productName: product.name } : f));
    setDropdowns({});
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function uploadAll() {
    setUploading(true);
    setDone(0);
    const toUpload = files.filter(f => f.productId && f.status !== "done");

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      const idx = files.indexOf(item);

      setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: "uploading" } : f));

      try {
        // Upload file
        const formData = new FormData();
        formData.append("file", item.file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url } = await uploadRes.json();

        // Save to product
        await fetch(`/api/products/${item.productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url, isPrimary: true }),
        });

        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: "done" } : f));
        setDone(d => d + 1);
      } catch {
        setFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: "error" } : f));
      }
    }
    setUploading(false);
  }

  const assigned = files.filter(f => f.productId).length;
  const completed = files.filter(f => f.status === "done").length;

  function getFiltered(idx: number) {
    const q = (search[idx] || "").toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.productCode.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    ).slice(0, 15);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/products" className="text-sm text-blue-600 hover:underline mb-1 inline-block">← สินค้า</Link>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload รูปสินค้า</h1>
          <p className="text-gray-500 text-sm mt-1">ลากรูปหลายไฟล์มาวาง → เลือกสินค้า → upload ทีเดียว</p>
        </div>
        {assigned > 0 && (
          <button onClick={uploadAll} disabled={uploading || assigned === 0}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg">
            {uploading ? `กำลัง upload... (${done}/${assigned})` : completed > 0 ? `Upload อีก ${assigned - completed} รูป` : `Upload ${assigned} รูป`}
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition mb-6 ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} className="hidden" />
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="font-medium text-gray-700">ลากรูปมาวางที่นี่ หรือคลิกเพื่อเลือก</p>
        <p className="text-sm text-gray-400 mt-1">รองรับ JPG, PNG หลายไฟล์พร้อมกัน (สูงสุด 4MB/ไฟล์)</p>
      </div>

      {/* Stats */}
      {files.length > 0 && (
        <div className="flex gap-4 mb-4 text-sm">
          <span className="px-3 py-1 bg-gray-100 rounded-lg">ทั้งหมด {files.length} รูป</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">เลือกสินค้าแล้ว {assigned}</span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg">upload แล้ว {completed}</span>
        </div>
      )}

      {/* File List */}
      <div className="space-y-3">
        {files.map((item, idx) => (
          <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border transition ${
            item.status === "done" ? "bg-green-50 border-green-200" :
            item.status === "error" ? "bg-red-50 border-red-200" :
            item.status === "uploading" ? "bg-blue-50 border-blue-200" :
            "bg-white border-gray-200"
          }`}>
            {/* Preview */}
            <img src={item.preview} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />

            {/* File name */}
            <div className="w-32 shrink-0">
              <p className="text-xs text-gray-500 truncate">{item.file.name}</p>
              <p className="text-[10px] text-gray-400">{(item.file.size / 1024).toFixed(0)} KB</p>
            </div>

            {/* Product selector */}
            <div className="flex-1 relative">
              {item.status === "done" ? (
                <p className="text-sm text-green-700 font-medium">✓ {item.productName}</p>
              ) : (
                <>
                  <input
                    type="text"
                    value={item.productId ? item.productName : (search[idx] || "")}
                    onChange={e => { setSearch({ ...search, [idx]: e.target.value }); setDropdowns({ [idx]: true }); if (item.productId) assignProduct(idx, { id: 0, name: "", productCode: "", brand: null }); }}
                    onFocus={() => setDropdowns({ [idx]: true })}
                    placeholder="พิมพ์ชื่อหรือรหัสสินค้า..."
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${item.productId ? "border-green-300 bg-green-50" : "border-gray-300"}`}
                  />
                  {item.productId && (
                    <span className="absolute right-2 top-2 text-green-600 text-xs">✓ เลือกแล้ว</span>
                  )}
                  {dropdowns[idx] && !item.productId && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getFiltered(idx).map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { assignProduct(idx, p); setSearch({ ...search, [idx]: "" }); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-gray-400 text-xs ml-2">{p.productCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status */}
            <div className="w-20 text-center shrink-0">
              {item.status === "uploading" && <span className="text-xs text-blue-600 animate-pulse">uploading...</span>}
              {item.status === "done" && <span className="text-xs text-green-600 font-bold">สำเร็จ</span>}
              {item.status === "error" && <span className="text-xs text-red-600">ผิดพลาด</span>}
            </div>

            {/* Remove */}
            {item.status !== "done" && (
              <button onClick={() => removeFile(idx)} className="text-gray-300 hover:text-red-500 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>ยังไม่มีรูป — ลากไฟล์มาวางด้านบน หรือคลิกเพื่อเลือก</p>
        </div>
      )}
    </div>
  );
}
