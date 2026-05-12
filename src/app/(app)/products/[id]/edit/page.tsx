import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อสินค้า", required: true },
  { name: "unit", label: "หน่วย" },
  { name: "sellingPrice", label: "ราคาขาย", type: "number", required: true },
  { name: "costPrice", label: "ราคาทุน", type: "number" },
  { name: "brand", label: "แบรนด์" },
  { name: "description", label: "รายละเอียด" },
];

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });
  if (!product) notFound();

  return (
    <EntityForm
      title={`แก้ไขสินค้า: ${product.name}`}
      fields={fields}
      apiUrl={`/api/products/${product.id}`}
      redirectUrl={`/products/${product.id}`}
      initialData={{
        name: product.name, unit: product.unit,
        sellingPrice: Number(product.sellingPrice), costPrice: Number(product.costPrice),
        brand: product.brand, description: product.description,
      }}
      method="PUT"
    />
  );
}
