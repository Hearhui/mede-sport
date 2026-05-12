import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const customer = await prisma.customer.update({
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
      fax: body.fax || null,
      contactName: body.contactName || null,
      creditTermDays: body.creditTermDays || 0,
    },
  });
  return NextResponse.json(customer);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
