"use client";

import Link from "next/link";

export default function PrintActions({ documentId }: { documentId: number }) {
  return (
    <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between print:hidden">
      <Link href={`/documents/${documentId}`} className="text-blue-600 hover:underline text-sm">
        ← กลับหน้ารายละเอียด
      </Link>
      <div className="flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          พิมพ์ / บันทึก PDF
        </button>
        <p className="text-xs text-gray-400 self-center">Tip: เลือก &quot;Save as PDF&quot; ใน Print dialog เพื่อบันทึกเป็น PDF</p>
      </div>
    </div>
  );
}
