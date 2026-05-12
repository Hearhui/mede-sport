"use client";

import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อสินค้า", required: true },
  { name: "unit", label: "หน่วย" },
  { name: "sellingPrice", label: "ราคาขาย", type: "number", required: true },
  { name: "costPrice", label: "ราคาทุน", type: "number" },
  { name: "brand", label: "แบรนด์" },
  { name: "description", label: "รายละเอียด" },
];

export default function EditProductForm({ product }: { product: any }) {
  return (
    <EntityForm
      title={`แก้ไขสินค้า: ${product.name}`}
      fields={fields}
      apiUrl={`/api/products/${product.id}`}
      redirectUrl="/products"
      initialData={{
        name: product.name,
        unit: product.unit,
        sellingPrice: Number(product.sellingPrice),
        costPrice: Number(product.costPrice),
        brand: product.brand,
        description: product.description,
      }}
      method="PUT"
    />
  );
}
