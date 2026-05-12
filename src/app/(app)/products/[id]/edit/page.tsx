import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อสินค้า", required: true },
  { name: "unit", label: "หน่วย", placeholder: "อัน, คู่, ชุด, ลูก" },
  { name: "sellingPrice", label: "ราคาขาย", type: "number", required: true },
  { name: "costPrice", label: "ราคาทุน", type: "number" },
  { name: "brand", label: "แบรนด์" },
  { name: "sku", label: "SKU" },
  { name: "barcode", label: "Barcode" },
  { name: "color", label: "สี" },
  { name: "size", label: "ขนาด", placeholder: "เช่น S, M, L, XL หรือ 40x30 cm" },
  { name: "weight", label: "น้ำหนัก", placeholder: "เช่น 500g, 1.2kg" },
  { name: "material", label: "วัสดุ", placeholder: "เช่น PVC, PU, หนังแท้" },
  { name: "origin", label: "แหล่งผลิต/นำเข้า", placeholder: "เช่น ไทย, จีน, ญี่ปุ่น" },
  { name: "warranty", label: "การรับประกัน", placeholder: "เช่น 1 ปี, 6 เดือน" },
  { name: "minOrder", label: "สั่งขั้นต่ำ", type: "number" },
  { name: "description", label: "รายละเอียดสินค้า" },
  { name: "specifications", label: "Specifications (เพิ่มเติม)" },
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
        brand: product.brand, sku: product.sku, barcode: product.barcode,
        color: product.color, size: product.size, weight: product.weight,
        material: product.material, origin: product.origin, warranty: product.warranty,
        minOrder: product.minOrder, description: product.description,
        specifications: product.specifications,
      }}
      method="PUT"
    />
  );
}
