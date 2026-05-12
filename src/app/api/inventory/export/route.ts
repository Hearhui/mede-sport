import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const inventory = await prisma.inventory.findMany({
    include: { product: true, location: true },
    orderBy: [{ location: { code: "asc" } }, { product: { name: "asc" } }],
  });

  const data = inventory.map((inv) => ({
    "รหัสสินค้า": inv.product.productCode,
    "ชื่อสินค้า": inv.product.name,
    "หน่วย": inv.product.unit,
    "ตำแหน่ง (Location)": inv.location.code,
    "จำนวนคงเหลือ": inv.quantity,
    "ราคาทุน": Number(inv.product.costPrice),
    "ราคาขาย": Number(inv.product.sellingPrice),
    "มูลค่าทุนรวม": inv.quantity * Number(inv.product.costPrice),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 14 }, { wch: 40 }, { wch: 8 }, { wch: 15 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mede-sport-inventory-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
