import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อลูกค้า", required: true, placeholder: "ชื่อบริษัท/บุคคล" },
  { name: "addressLine1", label: "ที่อยู่ บรรทัด 1", placeholder: "เลขที่" },
  { name: "addressLine2", label: "ที่อยู่ บรรทัด 2", placeholder: "ถนน/ซอย" },
  { name: "subdistrict", label: "แขวง/ตำบล" },
  { name: "district", label: "เขต/อำเภอ" },
  { name: "province", label: "จังหวัด" },
  { name: "postalCode", label: "รหัสไปรษณีย์" },
  { name: "taxId", label: "เลขประจำตัวผู้เสียภาษี" },
  { name: "phone", label: "โทรศัพท์" },
  { name: "contactName", label: "ชื่อผู้ติดต่อ" },
  { name: "creditTermDays", label: "เครดิต (วัน)", type: "number", placeholder: "0 = เงินสด" },
];

export default function NewCustomerPage() {
  return (
    <EntityForm
      title="เพิ่มลูกค้าใหม่"
      fields={fields}
      apiUrl="/api/customers"
      redirectUrl="/customers"
    />
  );
}
