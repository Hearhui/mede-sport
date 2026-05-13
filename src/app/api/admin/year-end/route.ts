import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keepProducts, keepCustomers, keepSuppliers, keepInventory, keepLocations } = body;
    const results: string[] = [];

    // Always delete transactional data
    await prisma.packingBoxItem.deleteMany();
    await prisma.packingBox.deleteMany();
    await prisma.packingList.deleteMany();
    await prisma.billingNoteItem.deleteMany();
    await prisma.billingNote.deleteMany();
    await prisma.documentItem.deleteMany();
    await prisma.document.deleteMany();
    results.push("ลบเอกสารทั้งหมดแล้ว");

    await prisma.posTransactionItem.deleteMany();
    await prisma.posTransaction.deleteMany();
    results.push("ลบ POS ทั้งหมดแล้ว");

    await prisma.goodsReceiptItem.deleteMany();
    await prisma.goodsReceipt.deleteMany();
    results.push("ลบใบรับสินค้าทั้งหมดแล้ว");

    await prisma.expense.deleteMany();
    results.push("ลบรายจ่ายทั้งหมดแล้ว");

    await prisma.inventoryMovement.deleteMany();
    results.push("ลบประวัติการเคลื่อนไหวสต็อคแล้ว");

    if (!keepInventory) {
      await prisma.inventory.deleteMany();
      results.push("ลบสต็อคทั้งหมดแล้ว (เริ่มนับใหม่)");
    } else {
      results.push("เก็บสต็อคยกมาปีใหม่");
    }

    if (!keepProducts) {
      await prisma.catalogItem.deleteMany();
      await prisma.productImage.deleteMany();
      await prisma.purchaseOrderItem.deleteMany();
      await prisma.inventory.deleteMany();
      await prisma.product.deleteMany();
      results.push("ลบสินค้าทั้งหมดแล้ว");
    } else {
      results.push("เก็บรายชื่อสินค้ายกมาปีใหม่");
    }

    if (!keepCustomers) {
      await prisma.customer.deleteMany();
      results.push("ลบลูกค้าทั้งหมดแล้ว");
    } else {
      results.push("เก็บรายชื่อลูกค้ายกมาปีใหม่");
    }

    if (!keepSuppliers) {
      await prisma.purchaseOrder.deleteMany();
      await prisma.supplier.deleteMany();
      results.push("ลบซัพพลายเออร์ทั้งหมดแล้ว");
    } else {
      results.push("เก็บรายชื่อซัพพลายเออร์ยกมาปีใหม่");
    }

    if (!keepLocations) {
      await prisma.location.deleteMany();
      results.push("ลบ Location ทั้งหมดแล้ว");
    }

    await prisma.catalog.deleteMany();

    return NextResponse.json({ message: "ปิดปีสำเร็จ!\n\n" + results.join("\n") });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
