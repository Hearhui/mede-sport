import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await prisma.catalog.findUnique({
    where: { id: parseInt(id) },
    include: {
      items: {
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 }, inventory: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!catalog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(catalog);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.catalogItem.deleteMany({ where: { catalogId: parseInt(id) } });
  await prisma.catalog.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
