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
    const name = row["ชื่อลูกค้า/บริษัท*"] || row["ชื่อลูกค้า/บริษัท"] || row["name"];
    if (!name) continue;

    const data = {
      name,
      addressLine1: row["ที่อยู่ 1"] || null,
      addressLine2: row["ที่อยู่ 2"] || null,
      subdistrict: row["แขวง/ตำบล"] || null,
      district: row["เขต/อำเภอ"] || null,
      province: row["จังหวัด"] || null,
      postalCode: row["รหัสไปรษณีย์"]?.toString() || null,
      taxId: row["เลขผู้เสียภาษี"]?.toString() || null,
      phone: row["โทร"]?.toString() || null,
      contactName: row["ผู้ติดต่อ"] || null,
      creditTermDays: parseInt(row["เครดิต(วัน)"]) || 0,
    };

    try {
      const existing = await prisma.customer.findFirst({ where: { name } });
      if (existing) {
        await prisma.customer.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        const last = await prisma.customer.findFirst({ orderBy: { id: "desc" } });
        const nextId = (last?.id || 0) + 1;
        await prisma.customer.create({ data: { ...data, customerCode: `CST${String(nextId).padStart(6, "0")}` } });
        created++;
      }
    } catch (e: any) {
      errors.push(`${name}: ${e.message}`);
    }
  }

  return NextResponse.json({ created, updated, errors, total: rows.length });
}
