import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const template = req.nextUrl.searchParams.get("template") === "1";

  if (template) {
    // Download empty template with headers
    const ws = XLSX.utils.aoa_to_sheet([
      ["ชื่อสินค้า*", "หน่วย", "ราคาขาย*", "ราคาทุน", "แบรนด์", "รายละเอียด", "SKU", "บาร์โค้ด", "สี", "ขนาด", "น้ำหนัก", "วัสดุ", "แหล่งผลิต", "รับประกัน"],
      ["ตัวอย่าง: ลูกฟุตบอล Molten F5A2810", "ลูก", "720", "480", "Molten", "ลูกฟุตบอล PU หนังเย็บมือ", "", "", "", "เบอร์ 5", "", "PU", "ไทย", ""],
    ]);
    ws["!cols"] = [{ wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=products_template.xlsx",
      },
    });
  }

  // Export all products
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventory: true },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => ({
    "รหัสสินค้า": p.productCode,
    "ชื่อสินค้า": p.name,
    "หน่วย": p.unit,
    "ราคาขาย": Number(p.sellingPrice),
    "ราคาทุน": Number(p.costPrice),
    "กำไร": Number(p.sellingPrice) - Number(p.costPrice),
    "Margin%": Number(p.sellingPrice) > 0 ? Math.round(((Number(p.sellingPrice) - Number(p.costPrice)) / Number(p.sellingPrice)) * 100) : 0,
    "สต็อครวม": p.inventory.reduce((s, i) => s + i.quantity, 0),
    "แบรนด์": p.brand || "",
    "รายละเอียด": p.description || "",
    "SKU": p.sku || "",
    "บาร์โค้ด": p.barcode || "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 45 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=products_${new Date().toISOString().slice(0, 10)}.xlsx`,
    },
  });
}
