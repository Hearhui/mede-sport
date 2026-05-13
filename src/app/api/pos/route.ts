import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const dateFrom = req.nextUrl.searchParams.get("dateFrom");
  const dateTo = req.nextUrl.searchParams.get("dateTo");

  const where: any = {};
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59");
  }

  const [transactions, total] = await Promise.all([
    prisma.posTransaction.findMany({
      where,
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.posTransaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: { productId: number; quantity: number; unitPrice: number; description: string }[] = body.items;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  // Generate transaction number
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const lastTx = await prisma.posTransaction.findFirst({
    where: { transactionNo: { startsWith: `POS${yy}${mm}${dd}` } },
    orderBy: { transactionNo: "desc" },
  });
  const seq = lastTx ? parseInt(lastTx.transactionNo.slice(-4)) + 1 : 1;
  const transactionNo = `POS${yy}${mm}${dd}${String(seq).padStart(4, "0")}`;

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = body.discount || 0;
  const vatAmount = (subtotal - discount) - (subtotal - discount) / 1.07;
  const total = subtotal - discount;
  const cashReceived = body.cashReceived || total;
  const changeAmount = cashReceived - total;

  // Create transaction + update inventory in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.posTransaction.create({
      data: {
        transactionNo,
        customerId: body.customerId || null,
        customerName: body.customerName || null,
        customerCompany: body.customerCompany || null,
        customerAddress: body.customerAddress || null,
        customerTaxId: body.customerTaxId || null,
        subtotal,
        discount,
        vatAmount: Math.round(vatAmount * 100) / 100,
        total,
        paymentMethod: body.paymentMethod || "CASH",
        cashReceived,
        changeAmount: Math.max(0, changeAmount),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            amount: item.unitPrice * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Deduct inventory (from หน้าร้าน location)
    let shopLocation = await tx.location.findUnique({ where: { code: "หน้าร้าน" } });
    if (!shopLocation) {
      shopLocation = await tx.location.create({ data: { code: "หน้าร้าน", name: "หน้าร้าน" } });
    }

    for (const item of items) {
      // Try to deduct from หน้าร้าน first
      const inv = await tx.inventory.findUnique({
        where: { productId_locationId: { productId: item.productId, locationId: shopLocation.id } },
      });

      if (inv && inv.quantity >= item.quantity) {
        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: inv.quantity - item.quantity },
        });
      } else {
        // Deduct from any location with stock
        const anyInv = await tx.inventory.findFirst({
          where: { productId: item.productId, quantity: { gte: item.quantity } },
        });
        if (anyInv) {
          await tx.inventory.update({
            where: { id: anyInv.id },
            data: { quantity: anyInv.quantity - item.quantity },
          });
        }
      }

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          locationId: shopLocation.id,
          movementType: "OUT",
          quantity: item.quantity,
          referenceType: "POS",
          referenceId: transaction.id,
          note: `POS: ${transactionNo}`,
        },
      });
    }

    return transaction;
  });

  return NextResponse.json(result, { status: 201 });
}
