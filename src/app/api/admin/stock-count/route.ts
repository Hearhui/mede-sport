import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get("locationId");

  const where: any = {};
  if (locationId) where.locationId = parseInt(locationId);

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: { select: { id: true, productCode: true, name: true, unit: true } },
      location: { select: { id: true, name: true, code: true } },
    },
    orderBy: { product: { name: "asc" } },
  });

  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ inventory, locations });
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    // items = [{ inventoryId, actualQty }]

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "กรุณาส่งข้อมูลตรวจนับ" }, { status: 400 });
    }

    let updated = 0;
    let adjusted = 0;

    for (const item of items) {
      const inv = await prisma.inventory.findUnique({ where: { id: item.inventoryId } });
      if (!inv) continue;

      const diff = item.actualQty - inv.quantity;

      // Update inventory quantity
      await prisma.inventory.update({
        where: { id: item.inventoryId },
        data: { quantity: item.actualQty },
      });

      // Record movement if different
      if (diff !== 0) {
        await prisma.inventoryMovement.create({
          data: {
            productId: inv.productId,
            locationId: inv.locationId,
            movementType: diff > 0 ? "IN" : "OUT",
            quantity: Math.abs(diff),
            referenceType: "STOCK_COUNT",
            referenceId: 0,
            note: `ตรวจนับสต็อค: ${inv.quantity} → ${item.actualQty} (${diff > 0 ? "+" : ""}${diff})`,
          },
        });
        adjusted++;
      }
      updated++;
    }

    return NextResponse.json({ updated, adjusted, message: `อัปเดต ${updated} รายการ, ปรับปรุง ${adjusted} รายการ` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
