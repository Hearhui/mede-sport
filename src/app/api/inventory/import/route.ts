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

  // Read as array of arrays (to support both formats)
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Detect format by checking headers
  // Format A (system export): รหัสสินค้า | ชื่อสินค้า | หน่วย | ตำแหน่ง (Location) | จำนวนคงเหลือ | ราคาทุน | ราคาขาย
  // Format B (original Excel): ลำดับ | รายการสินค้า | จำนวน | หน่วย | ราคาขาย/หน่วย | จำนวนเงิน | ราคาขาย/หน่วย | จำนวน Stock | ทุน | Updated Date | Location | รวมทุน

  let headerRow = -1;
  let format: "system" | "original" | "unknown" = "unknown";

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i].map((v: any) => String(v || "").trim().toLowerCase());
    if (row.includes("รหัสสินค้า")) { headerRow = i; format = "system"; break; }
    if (row.some((v: string) => v.includes("รายการสินค้า")) || row.some((v: string) => v === "ลำดับ" && rawRows[i].some((c: any) => String(c).includes("stock")))) {
      headerRow = i; format = "original"; break;
    }
  }

  // If no header found, try json format
  if (format === "unknown") {
    const jsonRows: any[] = XLSX.utils.sheet_to_json(ws);
    return processSystemFormat(jsonRows);
  }

  let updated = 0;
  let created = 0;
  let newProducts = 0;
  let errors: string[] = [];

  if (format === "original") {
    // Original Excel format: columns are at fixed positions
    // Col 0: ลำดับ, Col 1: รายการสินค้า, Col 2: จำนวน, Col 3: หน่วย,
    // Col 4: ราคาขาย/หน่วย, Col 5: จำนวนเงิน, Col 6: ราคาขาย/หน่วย (another),
    // Col 7: จำนวน Stock, Col 8: ทุน, Col 9: Updated Date, Col 10: Location, Col 11: รวมทุน

    for (let i = headerRow + 2; i < rawRows.length; i++) {
      const row = rawRows[i];
      const name = String(row[1] || "").trim();
      if (!name) continue;

      const unit = String(row[3] || "อัน").trim();
      const sellingPrice = parseFloat(row[4]) || 0;
      const stockQty = parseInt(row[7]) || 0;
      const costPrice = parseFloat(row[8]) || 0;
      const locationCode = String(row[10] || "").trim() || "ไม่ระบุ";

      // Find or create product by name
      let product = await prisma.product.findFirst({ where: { name } });
      if (!product) {
        const count = await prisma.product.count();
        product = await prisma.product.create({
          data: {
            productCode: `PRD${String(count + 1).padStart(6, "0")}`,
            name, unit, sellingPrice, costPrice,
          },
        });
        newProducts++;
      } else {
        // Update prices if provided
        if (sellingPrice > 0 || costPrice > 0) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              ...(sellingPrice > 0 ? { sellingPrice } : {}),
              ...(costPrice > 0 ? { costPrice } : {}),
            },
          });
        }
      }

      // Update inventory
      let location = await prisma.location.findUnique({ where: { code: locationCode } });
      if (!location) {
        location = await prisma.location.create({ data: { code: locationCode, name: locationCode } });
      }

      const existing = await prisma.inventory.findUnique({
        where: { productId_locationId: { productId: product.id, locationId: location.id } },
      });

      if (existing) {
        await prisma.inventory.update({ where: { id: existing.id }, data: { quantity: stockQty } });
        updated++;
      } else if (stockQty > 0) {
        await prisma.inventory.create({
          data: { productId: product.id, locationId: location.id, quantity: stockQty },
        });
        created++;
      }
    }
  } else {
    // System format: use json rows
    const jsonRows: any[] = XLSX.utils.sheet_to_json(ws);
    return processSystemFormat(jsonRows);
  }

  return NextResponse.json({
    message: `Import สำเร็จ! อัพเดท ${updated}, สร้างใหม่ ${created}, สินค้าใหม่ ${newProducts}`,
    format: "original",
    updated, created, newProducts,
    errors: errors.slice(0, 10),
    totalRows: rawRows.length - headerRow - 2,
  });
}

async function processSystemFormat(rows: any[]) {
  let updated = 0;
  let created = 0;
  let errors: string[] = [];

  for (const row of rows) {
    // Support multiple column name variations
    const productCode = String(row["รหัสสินค้า"] || row["product_code"] || row["productCode"] || "").trim();
    const productName = String(row["ชื่อสินค้า"] || row["name"] || row["รายการสินค้า"] || "").trim();
    const locationCode = String(row["ตำแหน่ง (Location)"] || row["Location"] || row["location"] || row["คลัง"] || "หน้าร้าน").trim();
    const quantity = parseInt(row["จำนวนคงเหลือ"] || row["จำนวน"] || row["quantity"] || row["จำนวน Stock"] || 0);

    // Find product by code or name
    let product = null;
    if (productCode) {
      product = await prisma.product.findUnique({ where: { productCode } });
    }
    if (!product && productName) {
      product = await prisma.product.findFirst({ where: { name: productName } });
    }
    if (!product) {
      errors.push(`ไม่พบสินค้า: ${productCode || productName}`);
      continue;
    }

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

    // Update prices
    const costPrice = parseFloat(row["ราคาทุน"] || row["ทุน"] || row["cost_price"]);
    const sellingPrice = parseFloat(row["ราคาขาย"] || row["ราคาขาย/หน่วย"] || row["selling_price"]);
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
    message: `Import สำเร็จ! อัพเดท ${updated}, สร้างใหม่ ${created}`,
    format: "system",
    updated, created,
    errors: errors.slice(0, 10),
    totalRows: rows.length,
  });
}
