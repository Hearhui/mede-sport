import { prisma } from "@/lib/prisma";
import { recalcProductCosts } from "@/lib/cost-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const [receipts, total] = await Promise.all([
    prisma.goodsReceipt.findMany({
      include: {
        supplier: true,
        location: true,
        items: { include: { product: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.goodsReceipt.count(),
  ]);

  return NextResponse.json({ receipts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Generate GRN number
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const last = await prisma.goodsReceipt.findFirst({
    where: { grnNumber: { startsWith: `GRN${yy}${mm}` } },
    orderBy: { grnNumber: "desc" },
  });
  const seq = last ? parseInt(last.grnNumber.slice(-3)) + 1 : 1;
  const grnNumber = `GRN${yy}${mm}${String(seq).padStart(3, "0")}`;

  const items: { productId: number; quantity: number; unitCost: number }[] = body.items;
  const subtotal = items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const hasVat = body.hasVat || false;
  const vatAmount = hasVat ? subtotal * 0.07 : 0;
  const totalAmount = subtotal + vatAmount;

  // Ensure supplier exists or create
  let supplierId = body.supplierId;
  if (!supplierId && body.supplierName) {
    const code = `SUP${String(Date.now()).slice(-6)}`;
    const supplier = await prisma.supplier.create({
      data: { supplierCode: code, name: body.supplierName },
    });
    supplierId = supplier.id;
  }

  // Ensure location exists
  const locationCode = body.locationCode || "หน้าร้าน";
  let location = await prisma.location.findUnique({ where: { code: locationCode } });
  if (!location) {
    location = await prisma.location.create({ data: { code: locationCode, name: locationCode } });
  }

  // Get cost method setting
  const company = await prisma.companyInfo.findFirst({ select: { costMethod: true } });
  const costMethod = company?.costMethod || "JIT";

  const result = await prisma.$transaction(async (tx) => {
    const receipt = await tx.goodsReceipt.create({
      data: {
        grnNumber,
        supplierId,
        date: body.date ? new Date(body.date) : new Date(),
        hasVat,
        vatAmount: Math.round(vatAmount * 100) / 100,
        total: Math.round(totalAmount * 100) / 100,
        locationId: location!.id,
        notes: body.notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantityOrdered: item.quantity,
            quantityReceived: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: { items: true, supplier: true, location: true },
    });

    // Update inventory + product cost price
    for (const item of items) {
      const inv = await tx.inventory.findUnique({
        where: { productId_locationId: { productId: item.productId, locationId: location!.id } },
      });

      if (inv) {
        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: inv.quantity + item.quantity },
        });
      } else {
        await tx.inventory.create({
          data: { productId: item.productId, locationId: location!.id, quantity: item.quantity },
        });
      }

      // Recalculate JIT + Average cost
      await recalcProductCosts(tx, item.productId, costMethod);

      // Record movement
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          locationId: location!.id,
          movementType: "IN",
          quantity: item.quantity,
          referenceType: "GRN",
          referenceId: receipt.id,
          note: `GRN: ${grnNumber}`,
        },
      });
    }

    return receipt;
  });

  return NextResponse.json(result, { status: 201 });
}
