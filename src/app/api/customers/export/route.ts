import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const template = req.nextUrl.searchParams.get("template") === "1";

  if (template) {
    const ws = XLSX.utils.aoa_to_sheet([
      ["ชื่อลูกค้า/บริษัท*", "ที่อยู่ 1", "ที่อยู่ 2", "แขวง/ตำบล", "เขต/อำเภอ", "จังหวัด", "รหัสไปรษณีย์", "เลขผู้เสียภาษี", "โทร", "ผู้ติดต่อ", "เครดิต(วัน)"],
      ["ตัวอย่าง: บจก. ABC สปอร์ต", "123/45 ถ.สุขุมวิท", "", "คลองตัน", "คลองเตย", "กรุงเทพฯ", "10110", "0105500012345", "02-123-4567", "คุณสมชาย", "30"],
    ]);
    ws["!cols"] = [{ wch: 35 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers Template");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=customers_template.xlsx",
      },
    });
  }

  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  const rows = customers.map((c) => ({
    "รหัสลูกค้า": c.customerCode,
    "ชื่อลูกค้า/บริษัท": c.name,
    "ที่อยู่ 1": c.addressLine1 || "",
    "ที่อยู่ 2": c.addressLine2 || "",
    "แขวง/ตำบล": c.subdistrict || "",
    "เขต/อำเภอ": c.district || "",
    "จังหวัด": c.province || "",
    "รหัสไปรษณีย์": c.postalCode || "",
    "เลขผู้เสียภาษี": c.taxId || "",
    "โทร": c.phone || "",
    "ผู้ติดต่อ": c.contactName || "",
    "เครดิต(วัน)": c.creditTermDays,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=customers_${new Date().toISOString().slice(0, 10)}.xlsx`,
    },
  });
}
