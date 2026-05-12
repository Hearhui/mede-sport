"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProductImageManager({
  productId,
  images,
}: {
  productId: number;
  images: { id: number; imageUrl: string; isPrimary: boolean }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState("");

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }
      const { url: imageUrl } = await res.json();
      await saveImage(imageUrl);
    } finally {
      setUploading(false);
    }
  }

  async function saveImage(imageUrl: string) {
    await fetch(`/api/products/${productId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, isPrimary: images.length === 0 }),
    });
    router.refresh();
  }

  async function addByUrl() {
    if (!url.trim()) return;
    setUploading(true);
    try {
      await saveImage(url.trim());
      setUrl("");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(imageId: number) {
    if (!confirm("ลบรูปนี้?")) return;
    await fetch(`/api/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
    router.refresh();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.imageUrl} className="w-14 h-14 rounded-lg object-cover border" alt="" />
              <button onClick={() => removeImage(img.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center shadow">
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        {uploading ? (
          <p className="text-sm text-blue-600 font-medium">กำลังอัพโหลด...</p>
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500 mt-1">คลิกเลือกรูป หรือลากไฟล์มาวาง</p>
            <p className="text-xs text-gray-400">PNG, JPG (สูงสุด 4MB)</p>
          </>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="หรือวาง URL รูปภาพ..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
        <button onClick={addByUrl} disabled={uploading || !url.trim()}
          className="px-3 py-2 bg-gray-700 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 shrink-0">
          เพิ่ม
        </button>
      </div>
    </div>
  );
}
