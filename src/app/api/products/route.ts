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
          { productCode: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        inventory: { include: { location: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const count = await prisma.product.count();
  const productCode = body.productCode || `PRD${String(count + 1).padStart(6, "0")}`;
  const product = await prisma.product.create({
    data: {
      productCode,
      name: body.name,
      unit: body.unit || "อัน",
      sellingPrice: body.sellingPrice || 0,
      costPrice: body.costPrice || 0,
      brand: body.brand,
      description: body.description,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
