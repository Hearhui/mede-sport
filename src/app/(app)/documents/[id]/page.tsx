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

const statusLabels: Record<string, string> = {
  DRAFT: "แบบร่าง",
  SENT: "ส่งแล้ว",
  APPROVED: "อนุมัติ",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
};

const vatLabels: Record<string, string> = {
  IN_VAT: "รวม VAT",
  EX_VAT: "ไม่รวม VAT (บวกเพิ่ม)",
  NO_VAT: "ไม่มี VAT",
};

const convertOptions: Record<string, { targetType: string; label: string }[]> = {
  QUOTATION: [
    { targetType: "PURCHASE_ORDER", label: "สร้างใบสั่งซื้อ" },
    { targetType: "INVOICE", label: "สร้างใบกำกับภาษี" },
  ],
  PURCHASE_ORDER: [
    { targetType: "INVOICE", label: "สร้างใบกำกับภาษี" },
    { targetType: "DELIVERY_NOTE", label: "สร้างใบส่งของ" },
  ],
  INVOICE: [
    { targetType: "RECEIPT", label: "สร้างใบเสร็จรับเงิน" },
    { targetType: "CREDIT_NOTE", label: "สร้างใบลดหนี้" },
  ],
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      items: {
        orderBy: { itemNo: "asc" },
        include: {
          product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        },
      },
      parentDocument: { select: { id: true, documentNo: true, documentType: true } },
      childDocuments: { select: { id: true, documentNo: true, documentType: true, status: true } },
    },
  });

  if (!doc) notFound();

  const conversions = convertOptions[doc.documentType] || [];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/documents" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← กลับรายการเอกสาร
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{doc.documentNo}</h1>
          <p className="text-gray-500 mt-1">{typeLabels[doc.documentType]}</p>
        </div>
        <div className="flex gap-2">
          {conversions.map((opt) => (
            <ConvertButton
              key={opt.targetType}
              documentId={doc.id}
              targetType={opt.targetType}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Document chain */}
      {(doc.parentDocument || doc.childDocuments.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-700 mb-2">สายเอกสาร</p>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {doc.parentDocument && (
              <>
                <Link
                  href={`/documents/${doc.parentDocument.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {doc.parentDocument.documentNo} ({typeLabels[doc.parentDocument.documentType]})
                </Link>
                <span className="text-gray-400">→</span>
              </>
            )}
            <span className="font-bold text-blue-900">{doc.documentNo}</span>
            {doc.childDocuments.map((child) => (
              <span key={child.id} className="flex items-center gap-2">
                <span className="text-gray-400">→</span>
                <Link
                  href={`/documents/${child.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {child.documentNo} ({typeLabels[child.documentType]})
                </Link>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลเอกสาร</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">สถานะ</dt>
              <dd className="font-medium">{statusLabels[doc.status]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">วันที่</dt>
              <dd>{doc.date.toLocaleDateString("th-TH")}</dd>
            </div>
            {doc.validUntil && (
              <div className="flex justify-between">
                <dt className="text-gray-500">ใช้ได้ถึง</dt>
                <dd>{doc.validUntil.toLocaleDateString("th-TH")}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">เงื่อนไข</dt>
              <dd>{doc.paymentTerm || "Cash"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">VAT</dt>
              <dd>{vatLabels[doc.vatType]}</dd>
            </div>
          </dl>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">ลูกค้า</h2>
          <p className="font-medium text-gray-900">{doc.customer.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {[doc.customer.addressLine1, doc.customer.addressLine2].filter(Boolean).join(" ")}
          </p>
          <p className="text-sm text-gray-500">
            {[doc.customer.subdistrict, doc.customer.district, doc.customer.province, doc.customer.postalCode].filter(Boolean).join(" ")}
          </p>
          {doc.customer.taxId && (
            <p className="text-sm text-gray-400 mt-2">Tax ID: {doc.customer.taxId}</p>
          )}
          {doc.customer.phone && (
            <p className="text-sm text-gray-400">โทร: {doc.customer.phone}</p>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">รายการสินค้า ({doc.items.length} รายการ)</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-center px-4 py-3 font-medium text-gray-600 w-12">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รายการ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคา/หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doc.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-center text-gray-400">{item.itemNo}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {doc.showImages && item.product?.images?.[0] && (
                      <img src={item.product.images[0].imageUrl} className="w-10 h-10 rounded object-cover" alt="" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.description}</p>
                      {item.unit && <p className="text-xs text-gray-400">{item.unit}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  ฿{Number(item.unitPrice).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{Number(item.quantity)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  ฿{Number(item.amount).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">รวมเงิน</span>
                <span className="font-medium">฿{Number(doc.subtotal).toLocaleString()}</span>
              </div>
              {doc.vatType !== "NO_VAT" && (
                <div className="flex justify-between">
                  <span className="text-gray-500">VAT {Number(doc.vatRate)}%</span>
                  <span className="font-medium">฿{Number(doc.vatAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-semibold text-gray-900">ยอดรวมสุทธิ</span>
                <span className="font-bold text-blue-600">฿{Number(doc.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {doc.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">{doc.notes}</p>
        </div>
      )}
    </div>
  );
}
