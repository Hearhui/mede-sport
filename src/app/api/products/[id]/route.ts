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
  const product = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      name: body.name,
      unit: body.unit,
      sellingPrice: body.sellingPrice,
      costPrice: body.costPrice,
      brand: body.brand || null,
      description: body.description || null,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.product.update({ where: { id: parseInt(id) }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
