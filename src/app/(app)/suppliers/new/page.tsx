import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อผู้ขาย", required: true, placeholder: "ชื่อบริษัท/ร้านค้า" },
  { name: "addressLine1", label: "ที่อยู่ บรรทัด 1" },
  { name: "addressLine2", label: "ที่อยู่ บรรทัด 2" },
  { name: "subdistrict", label: "แขวง/ตำบล" },
  { name: "district", label: "เขต/อำเภอ" },
  { name: "province", label: "จังหวัด" },
  { name: "postalCode", label: "รหัสไปรษณีย์" },
  { name: "taxId", label: "เลขประจำตัวผู้เสียภาษี" },
  { name: "phone", label: "โทรศัพท์" },
  { name: "contactName", label: "ชื่อผู้ติดต่อ" },
];

export default function NewSupplierPage() {
  return (
    <EntityForm
      title="เพิ่มผู้ขายใหม่"
      fields={fields}
      apiUrl="/api/suppliers"
      redirectUrl="/suppliers"
    />
  );
}
