"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Attachment = { id: number; fileName: string; fileUrl: string; fileType: string | null; fileSize: number | null; note: string | null; createdAt: Date | string };

const fileIcons: Record<string, string> = {
  pdf: "text-red-500",
  doc: "text-blue-500", docx: "text-blue-500",
  xls: "text-green-500", xlsx: "text-green-500",
  jpg: "text-yellow-500", jpeg: "text-yellow-500", png: "text-purple-500",
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ProductAttachments({
  productId,
  attachments,
}: {
  productId: number;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [note, setNote] = useState("");

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (note) formData.append("note", note);

      const res = await fetch(`/api/products/${productId}/attachments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed");
        return;
      }
      setNote("");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(id: number, name: string) {
    if (!confirm(`ลบเอกสาร "${name}"?`)) return;
    await fetch(`/api/products/${productId}/attachments?attachmentId=${id}`, { method: "DELETE" });
    router.refresh();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
              <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0 hover:text-blue-600">
                <div className={`w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-xs font-bold uppercase ${fileIcons[att.fileType || ""] || "text-gray-500"}`}>
                  {att.fileType || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{att.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {formatSize(att.fileSize)}
                    {att.note && ` — ${att.note}`}
                  </p>
                </div>
              </a>
              <button
                onClick={() => deleteAttachment(att.id, att.fileName)}
                className="text-gray-300 hover:text-red-500 hidden group-hover:block shrink-0 ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
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
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); if (fileRef.current) fileRef.current.value = ""; }} className="hidden" />
        {uploading ? (
          <p className="text-sm text-blue-600 font-medium">กำลังอัพโหลด...</p>
        ) : (
          <>
            <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">คลิกเลือกไฟล์ หรือลากมาวาง</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, รูปภาพ (สูงสุด 10MB)</p>
          </>
        )}
      </div>

      {/* Note input */}
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="หมายเหตุสำหรับเอกสาร (ไม่จำเป็น)"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
    </div>
  );
}
