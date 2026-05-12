import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { customerCode: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const count = await prisma.customer.count();
  const customerCode = `CST${String(count + 1).padStart(6, "0")}`;

  const customer = await prisma.customer.create({
    data: {
      customerCode,
      name: body.name,
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      subdistrict: body.subdistrict || null,
      district: body.district || null,
      province: body.province || null,
      postalCode: body.postalCode || null,
      taxId: body.taxId || null,
      phone: body.phone || null,
      fax: body.fax || null,
      contactName: body.contactName || null,
      creditTermDays: body.creditTermDays || 0,
    },
  });
  return NextResponse.json(customer, { status: 201 });
}
