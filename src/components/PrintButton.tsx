"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium print:hidden">
      พิมพ์ / PDF
    </button>
  );
}
