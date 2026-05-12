import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { imageUrl, isPrimary } = await req.json();

  const image = await prisma.productImage.create({
    data: {
      productId: parseInt(id),
      imageUrl,
      isPrimary: isPrimary || false,
      sortOrder: 0,
    },
  });
  return NextResponse.json(image, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const imageId = parseInt(req.nextUrl.searchParams.get("imageId") || "0");
  if (!imageId) return NextResponse.json({ error: "Missing imageId" }, { status: 400 });
  await prisma.productImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}
