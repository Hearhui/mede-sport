import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);

  let updated = 0;
  let created = 0;
  let errors: string[] = [];

  for (const row of rows) {
    const productCode = String(row["รหัสสินค้า"] || "").trim();
    const locationCode = String(row["ตำแหน่ง (Location)"] || row["Location"] || "หน้าร้าน").trim();
    const quantity = parseInt(row["จำนวนคงเหลือ"] || row["จำนวน"] || 0);

    if (!productCode) { errors.push(`Row missing product code`); continue; }

    const product = await prisma.product.findUnique({ where: { productCode } });
    if (!product) { errors.push(`Product ${productCode} not found`); continue; }

    let location = await prisma.location.findUnique({ where: { code: locationCode } });
    if (!location) {
      location = await prisma.location.create({ data: { code: locationCode, name: locationCode } });
    }

    const existing = await prisma.inventory.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: location.id } },
    });

    if (existing) {
      await prisma.inventory.update({ where: { id: existing.id }, data: { quantity } });
      updated++;
    } else {
      await prisma.inventory.create({
        data: { productId: product.id, locationId: location.id, quantity },
      });
      created++;
    }

    // Update cost/sell price if provided
    const costPrice = parseFloat(row["ราคาทุน"]);
    const sellingPrice = parseFloat(row["ราคาขาย"]);
    if (!isNaN(costPrice) || !isNaN(sellingPrice)) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          ...(isNaN(costPrice) ? {} : { costPrice }),
          ...(isNaN(sellingPrice) ? {} : { sellingPrice }),
        },
      });
    }
  }

  return NextResponse.json({
    message: `Import สำเร็จ: อัพเดท ${updated} รายการ, สร้างใหม่ ${created} รายการ`,
    updated, created, errors: errors.slice(0, 10),
    totalRows: rows.length,
  });
}
