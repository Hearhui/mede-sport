import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { target } = await req.json();
  const results: string[] = [];

  try {
    if (target === "documents" || target === "ALL") {
      await prisma.packingBoxItem.deleteMany();
      await prisma.packingBox.deleteMany();
      await prisma.packingList.deleteMany();
      await prisma.billingNoteItem.deleteMany();
      await prisma.billingNote.deleteMany();
      await prisma.documentItem.deleteMany();
      await prisma.document.deleteMany();
      results.push("ลบเอกสารทั้งหมดแล้ว");
    }

    if (target === "pos" || target === "ALL") {
      await prisma.posTransactionItem.deleteMany();
      await prisma.posTransaction.deleteMany();
      results.push("ลบ POS ทั้งหมดแล้ว");
    }

    if (target === "goods_receipts" || target === "ALL") {
      await prisma.goodsReceiptItem.deleteMany();
      await prisma.goodsReceipt.deleteMany();
      results.push("ลบใบรับสินค้าทั้งหมดแล้ว");
    }

    if (target === "inventory" || target === "ALL") {
      await prisma.inventoryMovement.deleteMany();
      await prisma.inventory.deleteMany();
      results.push("ลบสต็อคทั้งหมดแล้ว");
    }

    if (target === "products" || target === "ALL") {
      // Must delete dependent records first
      await prisma.catalogItem.deleteMany();
      await prisma.productImage.deleteMany();
      await prisma.purchaseOrderItem.deleteMany();
      await prisma.product.deleteMany();
      results.push("ลบสินค้าทั้งหมดแล้ว");
    }

    if (target === "customers" || target === "ALL") {
      await prisma.customer.deleteMany();
      results.push("ลบลูกค้าทั้งหมดแล้ว");
    }

    if (target === "ALL") {
      await prisma.purchaseOrder.deleteMany();
      await prisma.supplier.deleteMany();
      await prisma.catalog.deleteMany();
      await prisma.category.deleteMany();
      await prisma.location.deleteMany();
      results.push("ลบซัพพลายเออร์, แคตตาล็อก, หมวดหมู่, โลเคชั่นแล้ว");
    }

    return NextResponse.json({ message: results.join("\n") });
  } catch (e: any) {
    return NextResponse.json({ error: `เกิดข้อผิดพลาด: ${e.message}` }, { status: 500 });
  }
}
