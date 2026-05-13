import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = req.nextUrl.searchParams.get("to") || new Date().toISOString().slice(0, 10);
  const fromDate = new Date(from);
  const toDate = new Date(to + "T23:59:59");

  const [productCount, customerCount, lowStock] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.inventory.count({ where: { quantity: { lte: 2 }, product: { isActive: true } } }),
  ]);

  const stockValue = await prisma.$queryRaw<[{ cost: number; sell: number }]>`
    SELECT COALESCE(SUM(i.quantity * p.cost_price), 0)::float as cost,
           COALESCE(SUM(i.quantity * p.selling_price), 0)::float as sell
    FROM inventory i JOIN products p ON p.id = i.product_id
  `;

  // Revenue in period
  const invoiceRevenue = await prisma.$queryRaw<[{ total: number; count: number }]>`
    SELECT COALESCE(SUM(total), 0)::float as total, COUNT(*)::int as count
    FROM documents WHERE document_type = 'INVOICE' AND status != 'CANCELLED'
      AND date >= ${fromDate} AND date <= ${toDate}
  `;

  const posRevenue = await prisma.$queryRaw<[{ total: number; count: number }]>`
    SELECT COALESCE(SUM(total), 0)::float as total, COUNT(*)::int as count
    FROM pos_transactions WHERE status = 'COMPLETED'
      AND date >= ${fromDate} AND date <= ${toDate}
  `;

  // Purchases in period
  const purchases = await prisma.$queryRaw<[{ total: number; count: number }]>`
    SELECT COALESCE(SUM(total), 0)::float as total, COUNT(*)::int as count
    FROM goods_receipts WHERE status = 'RECEIVED'
      AND date >= ${fromDate} AND date <= ${toDate}
  `;

  // Daily revenue for chart
  const dailyRevenue = await prisma.$queryRaw<{ day: string; invoice: number; pos: number }[]>`
    WITH days AS (
      SELECT generate_series(${fromDate}::date, ${toDate}::date, '1 day')::date as day
    ),
    inv AS (
      SELECT date::date as day, SUM(total)::float as total
      FROM documents WHERE document_type = 'INVOICE' AND status != 'CANCELLED'
        AND date >= ${fromDate} AND date <= ${toDate}
      GROUP BY date::date
    ),
    pos AS (
      SELECT date::date as day, SUM(total)::float as total
      FROM pos_transactions WHERE status = 'COMPLETED'
        AND date >= ${fromDate} AND date <= ${toDate}
      GROUP BY date::date
    )
    SELECT TO_CHAR(d.day, 'YYYY-MM-DD') as day,
           COALESCE(i.total, 0)::float as invoice,
           COALESCE(p.total, 0)::float as pos
    FROM days d LEFT JOIN inv i ON d.day = i.day LEFT JOIN pos p ON d.day = p.day
    ORDER BY d.day
  `;

  // Inventory movements in period
  const movements = await prisma.$queryRaw<[{ in_qty: number; out_qty: number }]>`
    SELECT COALESCE(SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END), 0)::int as in_qty,
           COALESCE(SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END), 0)::int as out_qty
    FROM inventory_movements WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
  `;

  // Top products in period
  const topProducts = await prisma.$queryRaw<{ name: string; qty: number; revenue: number }[]>`
    SELECT p.name, SUM(di.quantity)::float as qty, SUM(di.amount)::float as revenue
    FROM document_items di
    JOIN documents d ON d.id = di.document_id
    JOIN products p ON p.id = di.product_id
    WHERE d.document_type = 'INVOICE' AND d.status != 'CANCELLED'
      AND d.date >= ${fromDate} AND d.date <= ${toDate}
    GROUP BY p.name ORDER BY revenue DESC LIMIT 10
  `;

  // Top customers in period
  const topCustomers = await prisma.$queryRaw<{ name: string; count: number; revenue: number }[]>`
    SELECT c.name, COUNT(d.id)::int as count, SUM(d.total)::float as revenue
    FROM documents d JOIN customers c ON c.id = d.customer_id
    WHERE d.document_type = 'INVOICE' AND d.status != 'CANCELLED'
      AND d.date >= ${fromDate} AND d.date <= ${toDate}
    GROUP BY c.name ORDER BY revenue DESC LIMIT 10
  `;

  return NextResponse.json({
    period: { from, to },
    kpi: {
      productCount, customerCount, lowStock,
      stockCost: (stockValue as any)[0]?.cost || 0,
      stockSell: (stockValue as any)[0]?.sell || 0,
      invoiceRevenue: (invoiceRevenue as any)[0]?.total || 0,
      invoiceCount: (invoiceRevenue as any)[0]?.count || 0,
      posRevenue: (posRevenue as any)[0]?.total || 0,
      posCount: (posRevenue as any)[0]?.count || 0,
      purchaseTotal: (purchases as any)[0]?.total || 0,
      purchaseCount: (purchases as any)[0]?.count || 0,
      inventoryIn: (movements as any)[0]?.in_qty || 0,
      inventoryOut: (movements as any)[0]?.out_qty || 0,
    },
    dailyRevenue,
    topProducts,
    topCustomers,
  });
}
