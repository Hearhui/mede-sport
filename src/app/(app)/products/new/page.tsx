import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อสินค้า", required: true, placeholder: "เช่น ไม้แบดมินตัน FBT" },
  { name: "unit", label: "หน่วย", placeholder: "อัน, คู่, ชุด, ลูก" },
  { name: "sellingPrice", label: "ราคาขาย", type: "number", required: true },
  { name: "costPrice", label: "ราคาทุน", type: "number" },
  { name: "brand", label: "แบรนด์", placeholder: "เช่น FBT, Molten, Grandsport" },
  { name: "description", label: "รายละเอียด" },
];

export default function NewProductPage() {
  return (
    <EntityForm
      title="เพิ่มสินค้าใหม่"
      fields={fields}
      apiUrl="/api/products"
      redirectUrl="/products"
    />
  );
}
