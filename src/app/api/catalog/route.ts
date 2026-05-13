import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const catalogs = await prisma.catalog.findMany({
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } }, orderBy: { sortOrder: "asc" } },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ catalogs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const catalog = await prisma.catalog.create({
    data: {
      name: body.name,
      description: body.description,
      catalogType: body.catalogType || "SHOP",
      isPublic: body.isPublic || false,
      customerId: body.customerId || null,
      coverTitle: body.coverTitle || null,
      coverSubtitle: body.coverSubtitle || null,
      introText: body.introText || null,
      closingText: body.closingText || null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      items: {
        create: (body.items || []).map((item: any, idx: number) => ({
          productId: item.productId,
          customPrice: item.customPrice || null,
          sortOrder: idx,
          isFeatured: item.isFeatured || false,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });
  return NextResponse.json(catalog, { status: 201 });
}
