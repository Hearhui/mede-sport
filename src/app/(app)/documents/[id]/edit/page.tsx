import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditDocumentForm from "./EditDocumentForm";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: { customer: true, items: { orderBy: { itemNo: "asc" } } },
  });
  if (!doc) notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, customerCode: true, name: true },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">แก้ไขเอกสาร {doc.documentNo}</h1>
      <EditDocumentForm document={doc} customers={customers} />
    </div>
  );
}
