import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      items: { orderBy: { itemNo: "asc" }, include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
      parentDocument: { select: { id: true, documentNo: true, documentType: true } },
      childDocuments: { select: { id: true, documentNo: true, documentType: true } },
    },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(document);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Delete existing items and recreate
  if (body.items) {
    await prisma.documentItem.deleteMany({ where: { documentId: parseInt(id) } });

    const items = body.items;
    const subtotal = items.reduce(
      (s: number, i: any) => s + (i.unitPrice || 0) * (i.quantity || 0),
      0
    );
    const discount = body.discount || 0;
    const deposit = body.deposit || 0;
    const shippingCost = body.shippingCost || 0;
    const balanceAfterDiscount = subtotal - discount;
    const vatRate = body.vatRate ?? 7;
    let vatAmount = 0;
    let total = balanceAfterDiscount;
    if (body.vatType === "EX_VAT") {
      vatAmount = balanceAfterDiscount * (vatRate / 100);
      total = balanceAfterDiscount + vatAmount;
    } else if (body.vatType === "IN_VAT") {
      vatAmount = balanceAfterDiscount - balanceAfterDiscount / (1 + vatRate / 100);
    }
    total = total + shippingCost;

    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: {
        customerId: body.customerId,
        date: body.date ? new Date(body.date) : undefined,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        paymentTerm: body.paymentTerm,
        vatType: body.vatType,
        vatRate,
        subtotal,
        discount,
        deposit,
        shippingCost,
        vatAmount,
        total,
        showImages: body.showImages,
        showSignature: body.showSignature ?? true,
        status: body.status,
        notes: body.notes,
        items: {
          create: items.map((item: any, idx: number) => ({
            itemNo: idx + 1,
            productId: item.productId || null,
            description: item.description,
            unit: item.unit,
            unitPrice: item.unitPrice || 0,
            quantity: item.quantity || 0,
            amount: (item.unitPrice || 0) * (item.quantity || 0),
            imageUrl: item.imageUrl || null,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json(document);
  }

  // Simple update (status only, etc.)
  const document = await prisma.document.update({
    where: { id: parseInt(id) },
    data: {
      status: body.status,
      notes: body.notes,
    },
    include: { items: true, customer: true },
  });

  return NextResponse.json(document);
}
