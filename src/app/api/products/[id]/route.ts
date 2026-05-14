import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: { images: true, inventory: { include: { location: true } }, category: true },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Build update data — only include fields that are provided
  const data: any = {};
  const fields = [
    "name", "unit", "sellingPrice", "costPrice", "brand", "description",
    "sku", "barcode", "color", "size", "weight", "material",
    "origin", "warranty", "minOrder", "specifications",
  ];
  for (const f of fields) {
    if (f in body) data[f] = body[f] ?? null;
  }

  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data,
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.update({ where: { id: parseInt(id) }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
