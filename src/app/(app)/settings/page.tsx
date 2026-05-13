"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "document">("company");

  useEffect(() => {
    fetch("/api/company-info").then((r) => r.json()).then(setData);
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/company-info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!data) return <div className="p-8 text-gray-400">กำลังโหลด...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
          <p className="text-gray-500 mt-1">ข้อมูลบริษัท และ ข้อความในเอกสาร</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว ✓" : "บันทึก"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "company" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          ข้อมูลบริษัท
        </button>
        <button
          onClick={() => setActiveTab("document")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === "document" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          ข้อความในเอกสาร
        </button>
      </div>

      {activeTab === "company" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">ข้อมูลบริษัท</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ชื่อบริษัท (ไทย)" value={data.name} onChange={(v) => setData({ ...data, name: v })} required />
            <Field label="ชื่อบริษัท (อังกฤษ)" value={data.nameEn} onChange={(v) => setData({ ...data, nameEn: v })} />
            <Field label="เลขประจำตัวผู้เสียภาษี" value={data.taxId} onChange={(v) => setData({ ...data, taxId: v })} />
            <Field label="เบอร์โทร" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
            <Field label="แฟกซ์" value={data.fax} onChange={(v) => setData({ ...data, fax: v })} />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">ที่อยู่</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ที่อยู่ บรรทัด 1" value={data.address1} onChange={(v) => setData({ ...data, address1: v })} />
            <Field label="ที่อยู่ บรรทัด 2" value={data.address2} onChange={(v) => setData({ ...data, address2: v })} />
            <Field label="แขวง/ตำบล" value={data.subdistrict} onChange={(v) => setData({ ...data, subdistrict: v })} />
            <Field label="เขต/อำเภอ" value={data.district} onChange={(v) => setData({ ...data, district: v })} />
            <Field label="จังหวัด" value={data.province} onChange={(v) => setData({ ...data, province: v })} />
            <Field label="รหัสไปรษณีย์" value={data.postalCode} onChange={(v) => setData({ ...data, postalCode: v })} />
          </div>
        </div>
      )}

      {activeTab === "document" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">ข้อความในเอกสาร</h2>
          <p className="text-sm text-gray-500">ตั้งค่าข้อความที่จะแสดงในเอกสาร Invoice, ใบเสนอราคา ฯลฯ</p>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">ลายเซ็น (3 ช่อง)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="ลายเซ็นซ้าย (ผู้ออกเอกสาร)" value={data.docSignerLeft} onChange={(v) => setData({ ...data, docSignerLeft: v })} placeholder="ผู้ออกเอกสาร / Authorized" />
            <Field label="ลายเซ็นกลาง (ผู้อนุมัติ)" value={data.docSignerCenter} onChange={(v) => setData({ ...data, docSignerCenter: v })} placeholder="ผู้อนุมัติ / Approved" />
            <Field label="ลายเซ็นขวา (ผู้รับ)" value={data.docSignerRight} onChange={(v) => setData({ ...data, docSignerRight: v })} placeholder="ผู้รับสินค้า / Received by" />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">ข้อความอื่นๆ</h3>
          <FieldTextarea label="ข้อความท้ายเอกสาร" value={data.docFooterText} onChange={(v) => setData({ ...data, docFooterText: v })} placeholder="เช่น สินค้าที่ส่งมอบแล้วไม่สามารถเปลี่ยนหรือคืนได้" />
          <FieldTextarea label="หมายเหตุเริ่มต้น" value={data.docNoteDefault} onChange={(v) => setData({ ...data, docNoteDefault: v })} placeholder="ข้อความหมายเหตุที่จะแสดงโดยอัตโนมัติ" />
          <FieldTextarea label="ข้อมูลบัญชีธนาคาร" value={data.docBankInfo} onChange={(v) => setData({ ...data, docBankInfo: v })} placeholder="ธ.กสิกรไทย 000-0-00000-0 บจก. มีดี สปอร์ต" />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}
