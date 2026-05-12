import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditSupplierForm from "./EditForm";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(id) } });
  if (!supplier) notFound();
  return <EditSupplierForm supplier={supplier} />;
}
