"use client";

import { useRouter } from "next/navigation";

export default function ConvertButton({
  documentId,
  targetType,
  label,
}: {
  documentId: number;
  targetType: string;
  label: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/documents/${documentId}/convert?targetType=${targetType}`)}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
    >
      {label}
    </button>
  );
}
