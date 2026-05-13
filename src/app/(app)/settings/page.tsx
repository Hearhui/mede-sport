"use client";

import { useState, useEffect } from "react";

type Tab = "business" | "document" | "numbering" | "backup" | "yearend" | "admin";

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>("business");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState("");

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

  async function handleReset(target: string) {
    if (!confirm(`ยืนยันลบข้อมูล "${target}" ทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    setResetting(true);
    const res = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    });
    const result = await res.json();
    setResetResult(result.message || result.error);
    setResetting(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    if (url) setData({ ...data, logoUrl: url });
  }

  if (!data) return <div className="p-8 text-gray-400">กำลังโหลด...</div>;

  // Year-end state
  const [yearEndKeep, setYearEndKeep] = useState({ keepProducts: true, keepCustomers: true, keepSuppliers: true, keepInventory: true, keepLocations: true });
  const [yearEndConfirm, setYearEndConfirm] = useState("");
  const [yearEndResult, setYearEndResult] = useState("");

  const tabs: { key: Tab; label: string }[] = [
    { key: "business", label: "ข้อมูลธุรกิจ" },
    { key: "document", label: "ข้อความเอกสาร" },
    { key: "numbering", label: "เลขเอกสาร & VAT" },
    { key: "backup", label: "Backup" },
    { key: "yearend", label: "ปิดปี" },
    { key: "admin", label: "จัดการข้อมูล" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
          <p className="text-gray-500 mt-1">ข้อมูลธุรกิจ เอกสาร และระบบ</p>
        </div>
        {!["admin", "backup", "yearend"].includes(tab) && (
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกแล้ว" : "บันทึก"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "business" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">ข้อมูลธุรกิจ</h2>

          {/* Logo */}
          <div className="flex items-center gap-4">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-gray-200" />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-3xl">{data.name?.[0] || "B"}</span>
              </div>
            )}
            <div>
              <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
                อัปโหลดโลโก้
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 mt-1">แนะนำ PNG/JPG ขนาด 200x200px</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="ชื่อธุรกิจ (ไทย)" value={data.name} onChange={(v) => setData({ ...data, name: v })} required />
            <Field label="ชื่อธุรกิจ (อังกฤษ)" value={data.nameEn} onChange={(v) => setData({ ...data, nameEn: v })} />
            <div>
              <label className="block text-xs text-gray-500 mb-1">ประเภทธุรกิจ</label>
              <select value={data.businessType || ""} onChange={(e) => setData({ ...data, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">-- เลือก --</option>
                <option value="ขายปลีก">ขายปลีก</option>
                <option value="ขายส่ง">ขายส่ง</option>
                <option value="ขายปลีก-ขายส่ง">ขายปลีก-ขายส่ง</option>
                <option value="บริการ">บริการ</option>
                <option value="ผลิต">ผลิต</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <Field label="เลขประจำตัวผู้เสียภาษี" value={data.taxId} onChange={(v) => setData({ ...data, taxId: v })} />
            <Field label="เบอร์โทร" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
            <Field label="แฟกซ์" value={data.fax} onChange={(v) => setData({ ...data, fax: v })} />
            <Field label="อีเมล" value={data.email} onChange={(v) => setData({ ...data, email: v })} />
            <Field label="เว็บไซต์" value={data.website} onChange={(v) => setData({ ...data, website: v })} placeholder="https://..." />
            <Field label="LINE ID" value={data.lineId} onChange={(v) => setData({ ...data, lineId: v })} />
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

          <div>
            <label className="block text-xs text-gray-500 mb-1">รายละเอียดธุรกิจ</label>
            <textarea value={data.businessDesc || ""} onChange={(e) => setData({ ...data, businessDesc: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="อธิบายเกี่ยวกับธุรกิจ..." />
          </div>
        </div>
      )}

      {tab === "document" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">ข้อความในเอกสาร</h2>

          <h3 className="text-sm font-semibold text-gray-700">ลายเซ็น (3 ช่อง)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="ลายเซ็นซ้าย" value={data.docSignerLeft} onChange={(v) => setData({ ...data, docSignerLeft: v })} placeholder="ผู้ออกเอกสาร / Authorized" />
            <Field label="ลายเซ็นกลาง" value={data.docSignerCenter} onChange={(v) => setData({ ...data, docSignerCenter: v })} placeholder="ผู้อนุมัติ / Approved" />
            <Field label="ลายเซ็นขวา" value={data.docSignerRight} onChange={(v) => setData({ ...data, docSignerRight: v })} placeholder="ผู้รับสินค้า / Received by" />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">ข้อความอื่นๆ</h3>
          <FieldTextarea label="ข้อความท้ายเอกสาร" value={data.docFooterText} onChange={(v) => setData({ ...data, docFooterText: v })} placeholder="เช่น สินค้าที่ส่งมอบแล้วไม่สามารถเปลี่ยนหรือคืนได้" />
          <FieldTextarea label="หมายเหตุเริ่มต้น" value={data.docNoteDefault} onChange={(v) => setData({ ...data, docNoteDefault: v })} />
          <FieldTextarea label="ข้อมูลบัญชีธนาคาร" value={data.docBankInfo} onChange={(v) => setData({ ...data, docBankInfo: v })} placeholder="ธ.กสิกรไทย 000-0-00000-0 บจก. ..." />
        </div>
      )}

      {tab === "numbering" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">เลขเอกสาร & ภาษี</h2>

          <h3 className="text-sm font-semibold text-gray-700">VAT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">เปิด/ปิด VAT</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={data.vatEnabled ?? true}
                  onChange={(e) => setData({ ...data, vatEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300" />
                <span className="text-sm text-gray-700">{data.vatEnabled ? "เปิดใช้ VAT" : "ไม่ใช้ VAT"}</span>
              </label>
            </div>
            <Field label="อัตรา VAT (%)" value={data.vatRate?.toString()} onChange={(v) => setData({ ...data, vatRate: parseFloat(v) || 7 })} />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">Prefix เลขเอกสาร</h3>
          <p className="text-xs text-gray-400">ตัวอย่าง: QT2601001 (QT + ปี + เดือน + ลำดับ)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="ใบเสนอราคา" value={data.docPrefixQuote} onChange={(v) => setData({ ...data, docPrefixQuote: v })} placeholder="QT" />
            <Field label="ใบกำกับภาษี" value={data.docPrefixInvoice} onChange={(v) => setData({ ...data, docPrefixInvoice: v })} placeholder="INV" />
            <Field label="ใบเสร็จรับเงิน" value={data.docPrefixReceipt} onChange={(v) => setData({ ...data, docPrefixReceipt: v })} placeholder="RC" />
            <Field label="ใบส่งสินค้า" value={data.docPrefixDelivery} onChange={(v) => setData({ ...data, docPrefixDelivery: v })} placeholder="DN" />
            <Field label="ใบสั่งซื้อ" value={data.docPrefixPo} onChange={(v) => setData({ ...data, docPrefixPo: v })} placeholder="PO" />
          </div>
        </div>
      )}

      {tab === "backup" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Backup & Restore</h2>
          <p className="text-sm text-gray-500">สำรองข้อมูลทั้งหมดเป็นไฟล์ JSON เพื่อกู้คืนกรณีระบบมีปัญหา</p>
          <div className="flex gap-4">
            <a href="/api/admin/backup" download
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Backup (JSON)
            </a>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            <p className="font-medium">วิธีการ Backup:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>กด "Download Backup" เพื่อดาวน์โหลดไฟล์สำรองข้อมูล</li>
              <li>เก็บไฟล์ไว้ในที่ปลอดภัย (Google Drive, Dropbox, USB)</li>
              <li>ควร Backup อย่างน้อยสัปดาห์ละ 1 ครั้ง</li>
            </ol>
            <p className="mt-3 font-medium">การ Restore:</p>
            <p className="mt-1">ติดต่อผู้ดูแลระบบเพื่อนำไฟล์ Backup กลับมาใช้</p>
          </div>
        </div>
      )}

      {tab === "yearend" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">ปิดปี / ขึ้นปีใหม่</h2>
            <p className="text-sm text-gray-500 mb-6">ลบเอกสาร/POS/รายจ่ายของปีที่ผ่านมา แล้วเลือกว่าจะเก็บข้อมูลอะไรยกไปปีใหม่</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-medium text-blue-700 mb-3">เลือกข้อมูลที่ต้องการเก็บยกไปปีใหม่:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "keepProducts", label: "สินค้า" },
                  { key: "keepCustomers", label: "ลูกค้า" },
                  { key: "keepSuppliers", label: "ซัพพลายเออร์" },
                  { key: "keepInventory", label: "สต็อคสินค้า (ยกยอด)" },
                  { key: "keepLocations", label: "Location คลัง" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(yearEndKeep as any)[item.key]}
                      onChange={(e) => setYearEndKeep({ ...yearEndKeep, [item.key]: e.target.checked })}
                      className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-600 mb-2"><strong>ข้อมูลที่จะถูกลบ:</strong> เอกสารทั้งหมด, POS, ใบรับสินค้า, รายจ่าย, ประวัติสต็อค</p>
              <p className="text-xs text-red-500">กรุณา Backup ก่อนปิดปี!</p>
            </div>

            <div className="flex items-center gap-3">
              <input type="text" value={yearEndConfirm} onChange={(e) => setYearEndConfirm(e.target.value)}
                placeholder='พิมพ์ "ปิดปี" เพื่อยืนยัน' className="px-3 py-2 border border-red-300 rounded-lg text-sm w-48" />
              <button onClick={async () => {
                setResetting(true);
                const res = await fetch("/api/admin/year-end", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(yearEndKeep),
                });
                const data = await res.json();
                setYearEndResult(data.message || data.error);
                setResetting(false);
              }} disabled={yearEndConfirm !== "ปิดปี" || resetting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                {resetting ? "กำลังปิดปี..." : "ปิดปี & ขึ้นปีใหม่"}
              </button>
            </div>
            {yearEndResult && <div className="mt-4 p-4 bg-white rounded-lg border text-sm whitespace-pre-line">{yearEndResult}</div>}
          </div>
        </div>
      )}

      {tab === "admin" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">ลบข้อมูลเฉพาะส่วน</h2>
            <p className="text-sm text-gray-500 mb-4">ลบข้อมูลเฉพาะประเภทที่เลือก (ข้อมูลอื่นจะไม่ถูกลบ)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { target: "documents", label: "เอกสารทั้งหมด", desc: "ใบเสนอราคา, Invoice, ใบส่งของ" },
                { target: "pos", label: "POS ทั้งหมด", desc: "รายการขายหน้าร้าน" },
                { target: "goods_receipts", label: "รับสินค้าทั้งหมด", desc: "ใบรับสินค้า + inventory movement" },
                { target: "inventory", label: "สต็อคทั้งหมด", desc: "คลังสินค้า + การเคลื่อนไหว" },
                { target: "products", label: "สินค้าทั้งหมด", desc: "รายการสินค้า + รูป" },
                { target: "customers", label: "ลูกค้าทั้งหมด", desc: "ข้อมูลลูกค้า" },
              ].map((item) => (
                <button key={item.target} onClick={() => handleReset(item.target)} disabled={resetting}
                  className="text-left p-4 border border-red-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50">
                  <p className="font-medium text-red-700">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border-2 border-red-300 p-6">
            <h2 className="text-lg font-bold text-red-700 mb-2">Reset Database ทั้งหมด</h2>
            <p className="text-sm text-red-600 mb-4">ลบข้อมูลทั้งหมดในระบบ เริ่มต้นใหม่ 100% (ยกเว้น Company Info และ User)</p>
            <div className="flex items-center gap-3">
              <input type="text" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)}
                placeholder='พิมพ์ "RESET" เพื่อยืนยัน'
                className="px-3 py-2 border border-red-300 rounded-lg text-sm w-60" />
              <button onClick={() => handleReset("ALL")}
                disabled={resetConfirm !== "RESET" || resetting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                {resetting ? "กำลังลบ..." : "Reset ทั้งหมด"}
              </button>
            </div>
          </div>

          {resetResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm whitespace-pre-line">{resetResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder={placeholder} />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder={placeholder} />
    </div>
  );
}
