"use client";

import EntityForm from "@/components/EntityForm";

const fields = [
  { name: "name", label: "ชื่อลูกค้า", required: true },
  { name: "addressLine1", label: "ที่อยู่ บรรทัด 1" },
  { name: "addressLine2", label: "ที่อยู่ บรรทัด 2" },
  { name: "subdistrict", label: "แขวง/ตำบล" },
  { name: "district", label: "เขต/อำเภอ" },
  { name: "province", label: "จังหวัด" },
  { name: "postalCode", label: "รหัสไปรษณีย์" },
  { name: "taxId", label: "เลขประจำตัวผู้เสียภาษี" },
  { name: "phone", label: "โทรศัพท์" },
  { name: "contactName", label: "ชื่อผู้ติดต่อ" },
  { name: "creditTermDays", label: "เครดิต (วัน)", type: "number" },
];

export default function EditCustomerForm({ customer }: { customer: any }) {
  return (
    <EntityForm
      title={`แก้ไขลูกค้า: ${customer.name}`}
      fields={fields}
      apiUrl={`/api/customers/${customer.id}`}
      redirectUrl="/customers"
      initialData={customer}
      method="PUT"
    />
  );
}
