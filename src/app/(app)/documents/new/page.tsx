import { prisma } from "@/lib/prisma";
import DocumentForm from "./DocumentForm";

export default async function NewDocumentPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, customerCode: true, name: true, creditTermDays: true, addressLine1: true, taxId: true },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">สร้างใบเสนอราคาใหม่</h1>
      <DocumentForm customers={customers} />
    </div>
  );
}
