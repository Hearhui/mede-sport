import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const template = req.nextUrl.searchParams.get("template") === "1";

  if (template) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["ชื่อซัพพลายเออร์*", "ที่อยู่ 1", "ที่อยู่ 2", "แขวง/ตำบล", "เขต/อำเภอ", "จังหวัด", "รหัสไปรษณีย์", "เลขผู้เสียภาษี", "โทร", "ผู้ติดต่อ", "เครดิต(วัน)"],
      ["ตัวอย่าง: บจก. มอลเท็น ไทยแลนด์", "99/99 ถ.พระราม 3", "", "บางคอแหลม", "บางคอแหลม", "กรุงเทพฯ", "10120", "0105540012345", "02-987-6543", "คุณวิชัย", "45"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers Template");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=suppliers_template.xlsx",
      },
    });
  }

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  const rows = suppliers.map((s) => ({
    "รหัส": s.supplierCode,
    "ชื่อซัพพลายเออร์": s.name,
    "ที่อยู่ 1": s.addressLine1 || "",
    "แขวง/ตำบล": s.subdistrict || "",
    "เขต/อำเภอ": s.district || "",
    "จังหวัด": s.province || "",
    "รหัสไปรษณีย์": s.postalCode || "",
    "เลขผู้เสียภาษี": s.taxId || "",
    "โทร": s.phone || "",
    "ผู้ติดต่อ": s.contactName || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=suppliers_${new Date().toISOString().slice(0, 10)}.xlsx`,
    },
  });
}
