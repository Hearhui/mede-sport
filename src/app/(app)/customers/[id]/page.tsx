import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditCustomerForm from "./EditForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
  if (!customer) notFound();

  return <EditCustomerForm customer={customer} />;
}
