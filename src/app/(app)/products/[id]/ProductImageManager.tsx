"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductImageManager({
  productId,
  images,
}: {
  productId: number;
  images: { id: number; imageUrl: string; isPrimary: boolean }[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function addImage() {
    if (!url.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/products/${productId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, isPrimary: images.length === 0 }),
      });
      setUrl("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(imageId: number) {
    if (!confirm("ลบรูปนี้?")) return;
    await fetch(`/api/products/${productId}/images?imageId=${imageId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.imageUrl} className="w-14 h-14 rounded-lg object-cover border" alt="" />
              <button onClick={() => removeImage(img.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center">
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add image URL */}
      <div className="flex gap-2">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="วาง URL รูปภาพ..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
        <button onClick={addImage} disabled={saving || !url.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0">
          {saving ? "..." : "เพิ่มรูป"}
        </button>
      </div>
      <p className="text-xs text-gray-400">วาง URL รูปภาพจาก Google Drive, Imgur หรือ hosting อื่นๆ</p>
    </div>
  );
}
