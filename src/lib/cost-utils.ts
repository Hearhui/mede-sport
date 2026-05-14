/**
 * Recalculate JIT (last) and Average cost for a product from all GoodsReceiptItems.
 * Updates lastCostPrice, avgCostPrice, and costPrice (based on active costMethod).
 */
export async function recalcProductCosts(
  tx: any, // Prisma transaction client
  productId: number,
  costMethod: string = "JIT"
) {
  const receiptItems = await tx.goodsReceiptItem.findMany({
    where: {
      productId,
      goodsReceipt: { status: "RECEIVED" },
    },
    include: { goodsReceipt: { select: { date: true } } },
    orderBy: { goodsReceipt: { date: "desc" } },
  });

  if (receiptItems.length === 0) return;

  // JIT = latest receipt's unitCost
  const lastCostPrice = Number(receiptItems[0].unitCost);

  // Weighted average = sum(qty * unitCost) / sum(qty)
  let totalQtyCost = 0;
  let totalQty = 0;
  for (const item of receiptItems) {
    const qty = item.quantityReceived || 0;
    totalQty += qty;
    totalQtyCost += qty * Number(item.unitCost);
  }
  const avgCostPrice = totalQty > 0
    ? Math.round((totalQtyCost / totalQty) * 100) / 100
    : lastCostPrice;

  const activeCost = costMethod === "AVG" ? avgCostPrice : lastCostPrice;

  await tx.product.update({
    where: { id: productId },
    data: {
      lastCostPrice,
      avgCostPrice,
      costPrice: activeCost,
    },
  });
}
