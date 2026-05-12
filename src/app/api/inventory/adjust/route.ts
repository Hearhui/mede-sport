import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productId, locationCode, newQuantity, note } = body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let location = await prisma.location.findUnique({ where: { code: locationCode } });
  if (!location) {
    location = await prisma.location.create({ data: { code: locationCode, name: locationCode } });
  }

  const existing = await prisma.inventory.findUnique({
    where: { productId_locationId: { productId, locationId: location.id } },
  });

  const oldQty = existing?.quantity || 0;
  const diff = newQuantity - oldQty;

  if (existing) {
    await prisma.inventory.update({ where: { id: existing.id }, data: { quantity: newQuantity } });
  } else {
    await prisma.inventory.create({ data: { productId, locationId: location.id, quantity: newQuantity } });
  }

  await prisma.inventoryMovement.create({
    data: {
      productId, locationId: location.id,
      movementType: "ADJUSTMENT",
      quantity: Math.abs(diff),
      referenceType: "MANUAL",
      note: note || `ปรับยอด: ${oldQty} → ${newQuantity}`,
    },
  });

  return NextResponse.json({ ok: true, oldQty, newQty: newQuantity, diff });
}
