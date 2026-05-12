"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

export default function EntityForm({
  title,
  fields,
  apiUrl,
  redirectUrl,
  initialData,
  method,
}: {
  title: string;
  fields: Field[];
  apiUrl: string;
  redirectUrl: string;
  initialData?: Record<string, any>;
  method?: "POST" | "PUT";
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, any>>(initialData || {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(apiUrl, {
        method: method || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "เกิดข้อผิดพลาด");
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.options ? (
              <select
                value={data[field.name] || ""}
                onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="">-- เลือก --</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                value={data[field.name] || ""}
                onChange={(e) => setData({ ...data, [field.name]: field.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}
          </div>
        ))}

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 text-sm">
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm">
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
