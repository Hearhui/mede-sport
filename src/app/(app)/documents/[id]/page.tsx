import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ConvertButton from "./ConvertButton";

const typeLabels: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา",
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  INVOICE: "ใบกำกับภาษี/ใบเสร็จรับเงิน",
  RECEIPT: "ใบเสร็จรับเงิน",
  DELIVERY_NOTE: "ใบส่งของ",
  CREDIT_NOTE: "ใบลดหนี้",
  DEBIT_NOTE: "ใบเพิ่มหนี้",
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "แบบร่าง", color: "text-gray-700", bg: "bg-gray-100" },
  SENT: { label: "ส่งแล้ว", color: "text-blue-700", bg: "bg-blue-100" },
  APPROVED: { label: "อนุมัติ", color: "text-green-700", bg: "bg-green-100" },
  PAID: { label: "ชำระแล้ว", color: "text-emerald-700", bg: "bg-emerald-100" },
  CANCELLED: { label: "ยกเลิก", color: "text-red-700", bg: "bg-red-100" },
};

const vatLabels: Record<string, string> = {
  IN_VAT: "รวม VAT 7%",
  EX_VAT: "ไม่รวม VAT (บวก 7%)",
  NO_VAT: "ไม่มี VAT",
};

const convertOptions: Record<string, { targetType: string; label: string; icon: string }[]> = {
  QUOTATION: [
    { targetType: "PURCHASE_ORDER", label: "สร้างใบสั่งซื้อ", icon: "→ PO" },
    { targetType: "INVOICE", label: "สร้างใบกำกับภาษี", icon: "→ INV" },
  ],
  PURCHASE_ORDER: [
    { targetType: "INVOICE", label: "สร้างใบกำกับภาษี", icon: "→ INV" },
    { targetType: "DELIVERY_NOTE", label: "สร้างใบส่งของ", icon: "→ DN" },
  ],
  INVOICE: [
    { targetType: "RECEIPT", label: "สร้างใบเสร็จรับเงิน", icon: "→ REC" },
    { targetType: "CREDIT_NOTE", label: "สร้างใบลดหนี้", icon: "→ CN" },
  ],
};

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      items: {
        orderBy: { itemNo: "asc" },
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      },
      parentDocument: { select: { id: true, documentNo: true, documentType: true } },
      childDocuments: { select: { id: true, documentNo: true, documentType: true, status: true, total: true } },
    },
  });

  if (!doc) notFound();

  const conversions = convertOptions[doc.documentType] || [];
  const status = statusConfig[doc.status] || statusConfig.DRAFT;

  return (
    <div className="max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/documents" className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{doc.documentNo}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-gray-500 mt-0.5">{typeLabels[doc.documentType]}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/documents/${doc.id}/edit`}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            แก้ไข
          </Link>
          <Link
            href={`/documents/${doc.id}/print`}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 text-sm font-medium shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์เอกสาร
          </Link>
          {conversions.map((opt) => (
            <ConvertButton key={opt.targetType} documentId={doc.id} targetType={opt.targetType} label={opt.label} />
          ))}
        </div>
      </div>

      {/* Document chain */}
      {(doc.parentDocument || doc.childDocuments.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Document Chain</p>
          <div className="flex items-center gap-3 flex-wrap">
            {doc.parentDocument && (
              <>
                <Link href={`/documents/${doc.parentDocument.id}`}
                  className="bg-white border border-blue-200 px-4 py-2 rounded-lg text-sm hover:shadow-md transition-shadow">
                  <span className="text-blue-600 font-medium">{doc.parentDocument.documentNo}</span>
                  <span className="text-gray-400 ml-1 text-xs">({typeLabels[doc.parentDocument.documentType]})</span>
                </Link>
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
              {doc.documentNo}
            </div>
            {doc.childDocuments.map((child) => (
              <div key={child.id} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href={`/documents/${child.id}`}
                  className="bg-white border border-blue-200 px-4 py-2 rounded-lg text-sm hover:shadow-md transition-shadow">
                  <span className="text-blue-600 font-medium">{child.documentNo}</span>
                  <span className="text-gray-400 ml-1 text-xs">({typeLabels[child.documentType]})</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900">ลูกค้า</h2>
          </div>
          <p className="font-bold text-gray-900 text-lg">{doc.customer.name}</p>
          <div className="mt-2 text-sm text-gray-500 space-y-0.5">
            {doc.customer.addressLine1 && <p>{doc.customer.addressLine1} {doc.customer.addressLine2 || ""}</p>}
            <p>{[doc.customer.subdistrict, doc.customer.district, doc.customer.province, doc.customer.postalCode].filter(Boolean).join(" ")}</p>
            {doc.customer.taxId && <p className="font-mono text-xs mt-1">Tax ID: {doc.customer.taxId}</p>}
            {doc.customer.phone && <p>โทร: {doc.customer.phone}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-900">ข้อมูลเอกสาร</h2>
          </div>
          <dl className="space-y-2.5 text-sm">
            {[
              ["วันที่", doc.date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })],
              doc.validUntil ? ["ใช้ได้ถึง", doc.validUntil.toLocaleDateString("th-TH")] : null,
              doc.dueDate ? ["ครบกำหนด", doc.dueDate.toLocaleDateString("th-TH")] : null,
              ["เงื่อนไข", doc.paymentTerm || "Cash"],
              ["VAT", vatLabels[doc.vatType]],
              doc.referenceNo ? ["อ้างอิง", doc.referenceNo] : null,
            ].filter((x): x is string[] => x !== null).map(([label, value], i) => (
              <div key={i} className="flex justify-between items-center">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-900">รายการสินค้า ({doc.items.length} รายการ)</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-center px-4 py-3 font-medium text-gray-500 w-12">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">รายการ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 w-28">ราคา/หน่วย</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 w-20">จำนวน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 w-32">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doc.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5 text-center text-gray-400">{item.itemNo}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {doc.showImages && item.product?.images?.[0] && (
                      <img src={item.product.images[0].imageUrl} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.description}</p>
                      {item.unit && <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right text-gray-600 tabular-nums">
                  ฿{Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3.5 text-center text-gray-600">{Number(item.quantity)}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">
                  ฿{Number(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t-2 border-gray-200 px-6 py-5">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">รวมเงิน</span>
                <span className="font-medium tabular-nums">฿{Number(doc.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
              {doc.vatType !== "NO_VAT" && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT {Number(doc.vatRate)}%</span>
                  <span className="font-medium tabular-nums">฿{Number(doc.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-xl pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-900">ยอดรวมสุทธิ</span>
                <span className="font-bold text-blue-600 tabular-nums">฿{Number(doc.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Thumbnail */}
      <Link href={`/documents/${doc.id}/print`}
        className="block bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 p-6 text-center transition-colors group">
        <svg className="w-10 h-10 mx-auto text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p className="text-gray-500 group-hover:text-blue-600 mt-2 font-medium">ดูตัวอย่างเอกสารก่อนพิมพ์</p>
        <p className="text-xs text-gray-400 mt-1">คลิกเพื่อดูรูปแบบเอกสารจริงและพิมพ์</p>
      </Link>

      {doc.notes && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800"><strong>หมายเหตุ:</strong> {doc.notes}</p>
        </div>
      )}
    </div>
  );
}
