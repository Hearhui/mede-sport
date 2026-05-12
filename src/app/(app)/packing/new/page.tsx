import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PackingForm from "./PackingForm";

export default async function NewPackingPage({
  searchParams,
}: {
  searchParams: Promise<{ documentId?: string }>;
}) {
  const params = await searchParams;
  const documentId = parseInt(params.documentId || "0");
  if (!documentId) notFound();

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      customer: true,
      items: { orderBy: { itemNo: "asc" } },
    },
  });

  if (!document) notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">สร้างใบติดกล่อง</h1>
      <p className="text-gray-500 mb-6">
        อ้างอิงจาก {document.documentNo} — {document.customer.name}
      </p>
      <PackingForm document={document} />
    </div>
  );
}
