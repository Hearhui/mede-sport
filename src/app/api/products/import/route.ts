import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(ws);

  let created = 0, updated = 0, errors: string[] = [];

  for (const row of rows) {
    const name = row["ชื่อสินค้า*"] || row["ชื่อสินค้า"] || row["name"];
    if (!name) continue;

    const sellingPrice = parseFloat(row["ราคาขาย*"] || row["ราคาขาย"] || row["sellingPrice"] || 0);
    const costPrice = parseFloat(row["ราคาทุน"] || row["costPrice"] || 0);
    const unit = row["หน่วย"] || row["unit"] || "อัน";
    const brand = row["แบรนด์"] || row["brand"] || null;
    const description = row["รายละเอียด"] || row["description"] || null;
    const sku = row["SKU"] || row["sku"] || null;
    const barcode = row["บาร์โค้ด"] || row["barcode"] || null;
    const color = row["สี"] || row["color"] || null;
    const size = row["ขนาด"] || row["size"] || null;
    const weight = row["น้ำหนัก"] || row["weight"] || null;
    const material = row["วัสดุ"] || row["material"] || null;
    const origin = row["แหล่งผลิต"] || row["origin"] || null;
    const warranty = row["รับประกัน"] || row["warranty"] || null;

    try {
      // Check if product exists by name
      const existing = await prisma.product.findFirst({ where: { name } });
      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { sellingPrice, costPrice, unit, brand, description, sku, barcode, color, size, weight, material, origin, warranty },
        });
        updated++;
      } else {
        // Generate product code
        const last = await prisma.product.findFirst({ orderBy: { id: "desc" } });
        const nextId = (last?.id || 0) + 1;
        const productCode = `PRD${String(nextId).padStart(6, "0")}`;
        await prisma.product.create({
          data: { productCode, name, unit, sellingPrice, costPrice, brand, description, sku, barcode, color, size, weight, material, origin, warranty },
        });
        created++;
      }
    } catch (e: any) {
      errors.push(`${name}: ${e.message}`);
    }
  }

  return NextResponse.json({ created, updated, errors, total: rows.length });
}
