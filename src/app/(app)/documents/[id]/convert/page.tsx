import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ConvertForm from "./ConvertForm";

const typeLabels: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา", PURCHASE_ORDER: "ใบสั่งซื้อ",
  INVOICE: "ใบกำกับภาษี", RECEIPT: "ใบเสร็จรับเงิน",
  DELIVERY_NOTE: "ใบส่งของ", CREDIT_NOTE: "ใบลดหนี้",
};

export default async function ConvertDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ targetType?: string }>;
}) {
  const { id } = await params;
  const { targetType } = await searchParams;

  if (!targetType) notFound();

  const doc = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      items: { orderBy: { itemNo: "asc" } },
    },
  });

  if (!doc) notFound();

  // Check if customer info is complete for non-quotation documents
  const requiresFullInfo = ["INVOICE", "RECEIPT", "PURCHASE_ORDER", "DELIVERY_NOTE", "CREDIT_NOTE", "DEBIT_NOTE"].includes(targetType);
  const missingFields: string[] = [];
  if (requiresFullInfo) {
    if (!doc.customer.addressLine1) missingFields.push("ที่อยู่");
    if (!doc.customer.taxId) missingFields.push("เลขประจำตัวผู้เสียภาษี");
    if (!doc.customer.phone) missingFields.push("เบอร์โทร");
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        สร้าง{typeLabels[targetType] || targetType}
      </h1>
      <p className="text-gray-500 mb-6">
        จาก {typeLabels[doc.documentType]} เลขที่ <span className="font-bold text-blue-600">{doc.documentNo}</span> — {doc.customer.name}
      </p>

      {missingFields.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium text-amber-800">ข้อมูลลูกค้าไม่ครบ</p>
              <p className="text-sm text-amber-700 mt-1">
                ลูกค้า <strong>{doc.customer.name}</strong> ยังขาด: <strong>{missingFields.join(", ")}</strong>
              </p>
              <p className="text-sm text-amber-600 mt-2">
                กรุณา <a href={`/customers/${doc.customer.id}`} className="underline font-medium hover:text-amber-800">เพิ่มข้อมูลลูกค้า</a> ก่อนออกเอกสาร{typeLabels[targetType]}
              </p>
            </div>
          </div>
        </div>
      )}

      <ConvertForm
        sourceDocument={doc}
        targetType={targetType}
        customerMissingFields={missingFields}
      />
    </div>
  );
}
