import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";
  const where = search
    ? { OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { supplierCode: { contains: search, mode: "insensitive" as const } },
      ] }
    : {};

  const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: "asc" }, take: 100 });
  return NextResponse.json({ suppliers });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const count = await prisma.supplier.count();
  const supplierCode = body.supplierCode || `SUP${String(count + 1).padStart(6, "0")}`;

  const supplier = await prisma.supplier.create({
    data: {
      supplierCode,
      name: body.name,
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      subdistrict: body.subdistrict || null,
      district: body.district || null,
      province: body.province || null,
      postalCode: body.postalCode || null,
      taxId: body.taxId || null,
      phone: body.phone || null,
      contactName: body.contactName || null,
    },
  });
  return NextResponse.json(supplier, { status: 201 });
}
