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

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        สร้าง{typeLabels[targetType] || targetType}
      </h1>
      <p className="text-gray-500 mb-6">
        จาก {typeLabels[doc.documentType]} เลขที่ <span className="font-bold text-blue-600">{doc.documentNo}</span> — {doc.customer.name}
      </p>
      <ConvertForm
        sourceDocument={doc}
        targetType={targetType}
      />
    </div>
  );
}
