import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./EditForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { images: true, inventory: { include: { location: true } } },
  });
  if (!product) notFound();
  return <EditProductForm product={product} />;
}
