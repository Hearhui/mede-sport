import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const supplier = await prisma.supplier.update({
    where: { id: parseInt(id) },
    data: {
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
  return NextResponse.json(supplier);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.supplier.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
