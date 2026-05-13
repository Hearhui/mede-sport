import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Export all data as JSON backup
  const [companyInfo, products, customers, suppliers, documents, documentItems,
    posTransactions, posTransactionItems, inventory, inventoryMovements,
    goodsReceipts, goodsReceiptItems, expenses, catalogs, catalogItems,
    locations, categories] = await Promise.all([
    prisma.companyInfo.findMany(),
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.supplier.findMany(),
    prisma.document.findMany(),
    prisma.documentItem.findMany(),
    prisma.posTransaction.findMany(),
    prisma.posTransactionItem.findMany(),
    prisma.inventory.findMany(),
    prisma.inventoryMovement.findMany(),
    prisma.goodsReceipt.findMany(),
    prisma.goodsReceiptItem.findMany(),
    prisma.expense.findMany(),
    prisma.catalog.findMany(),
    prisma.catalogItem.findMany(),
    prisma.location.findMany(),
    prisma.category.findMany(),
  ]);

  const backup = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    data: {
      companyInfo, products, customers, suppliers, documents, documentItems,
      posTransactions, posTransactionItems, inventory, inventoryMovements,
      goodsReceipts, goodsReceiptItems, expenses, catalogs, catalogItems,
      locations, categories,
    },
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=backup_${new Date().toISOString().slice(0, 10)}.json`,
    },
  });
}
