import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [productCount, customerCount, supplierCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.supplier.count(),
  ]);

  const inventoryValue = await prisma.$queryRaw<[{ cost: number; sell: number }]>`
    SELECT COALESCE(SUM(i.quantity * p.cost_price), 0)::float as cost,
           COALESCE(SUM(i.quantity * p.selling_price), 0)::float as sell
    FROM inventory i JOIN products p ON p.id = i.product_id
  `;

  const lowStock = await prisma.inventory.count({
    where: { quantity: { lte: 2 }, product: { isActive: true } },
  });

  const monthlySales = await prisma.$queryRaw<{ month: string; revenue: number; count: number }[]>`
    SELECT TO_CHAR(date, 'YYYY-MM') as month,
           SUM(total)::float as revenue, COUNT(*)::int as count
    FROM documents WHERE document_type = 'INVOICE' AND status != 'CANCELLED'
    GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month DESC LIMIT 6
  `;

  const monthlyPos = await prisma.$queryRaw<{ month: string; revenue: number }[]>`
    SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(total)::float as revenue
    FROM pos_transactions WHERE status = 'COMPLETED'
    GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month DESC LIMIT 6
  `;

  const topProducts = await prisma.$queryRaw<{ name: string; qty: number; revenue: number }[]>`
    SELECT p.name, SUM(di.quantity)::float as qty, SUM(di.amount)::float as revenue
    FROM document_items di
    JOIN documents d ON d.id = di.document_id
    JOIN products p ON p.id = di.product_id
    WHERE d.document_type = 'INVOICE' AND d.status != 'CANCELLED'
    GROUP BY p.name ORDER BY revenue DESC LIMIT 8
  `;

  const topCustomers = await prisma.$queryRaw<{ name: string; count: number; revenue: number }[]>`
    SELECT c.name, COUNT(d.id)::int as count, SUM(d.total)::float as revenue
    FROM documents d JOIN customers c ON c.id = d.customer_id
    WHERE d.document_type = 'INVOICE' AND d.status != 'CANCELLED'
    GROUP BY c.name ORDER BY revenue DESC LIMIT 8
  `;

  const docCounts = await prisma.document.groupBy({ by: ["documentType"], _count: true });

  const recentDocs = await prisma.document.findMany({
    take: 8, orderBy: { date: "desc" },
    include: { customer: true },
  });

  return {
    productCount, customerCount, supplierCount,
    stockCost: (inventoryValue as any)[0]?.cost || 0,
    stockSell: (inventoryValue as any)[0]?.sell || 0,
    lowStock, monthlySales: monthlySales.reverse(),
    monthlyPos, topProducts, topCustomers, docCounts, recentDocs,
  };
}

const typeLabels: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา", PURCHASE_ORDER: "ใบสั่งซื้อ",
  INVOICE: "ใบกำกับภาษี", RECEIPT: "ใบเสร็จ",
  DELIVERY_NOTE: "ใบส่งของ", CREDIT_NOTE: "ใบลดหนี้", DEBIT_NOTE: "ใบเพิ่มหนี้",
};
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700", PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function DashboardPage() {
  const s = await getStats();

  const totalRevenue = s.monthlySales.reduce((a, b) => a + b.revenue, 0);
  const maxRevenue = Math.max(...s.monthlySales.map((m) => m.revenue), 1);
  const maxTopRev = Math.max(...s.topProducts.map((p) => p.revenue), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">ภาพรวมระบบ มีดี สปอร์ต</p>
        </div>
        <Link href="/documents/new"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm">
          + สร้างใบเสนอราคา
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "สินค้า", value: s.productCount, sub: `${s.lowStock} สต็อคต่ำ`, icon: "📦", color: "from-blue-500 to-blue-600", href: "/products" },
          { label: "ลูกค้า", value: s.customerCount, sub: `${s.supplierCount} ผู้ขาย`, icon: "👥", color: "from-green-500 to-emerald-600", href: "/customers" },
          { label: "มูลค่าสต็อค (ทุน)", value: `฿${Math.round(s.stockCost).toLocaleString()}`, sub: `ขาย ฿${Math.round(s.stockSell).toLocaleString()}`, icon: "🏪", color: "from-purple-500 to-purple-600", href: "/inventory" },
          { label: "รายได้ (Invoice)", value: `฿${Math.round(totalRevenue).toLocaleString()}`, sub: `${s.monthlySales.reduce((a, b) => a + b.count, 0)} รายการ`, icon: "💰", color: "from-orange-500 to-red-500", href: "/reports/pl" },
        ].map((card) => (
          <Link key={card.label} href={card.href}
            className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow"
            style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color}`} />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <p className="text-2xl font-bold mt-2">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</p>
              <p className="text-xs text-white/70 mt-1">{card.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">ยอดขายรายเดือน</h2>
            <Link href="/reports/pl" className="text-sm text-blue-600 hover:underline">ดูรายงาน P&L →</Link>
          </div>
          <div className="flex items-end gap-3 h-48">
            {s.monthlySales.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-gray-900">฿{Math.round(m.revenue / 1000)}k</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                  style={{ height: `${Math.max(4, (m.revenue / maxRevenue) * 140)}px` }} />
                <span className="text-xs text-gray-500">{m.month.slice(5)}</span>
              </div>
            ))}
            {s.monthlySales.length === 0 && (
              <p className="flex-1 text-center text-gray-400 py-16">ยังไม่มีข้อมูลยอดขาย</p>
            )}
          </div>
        </div>

        {/* Document Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">เอกสารในระบบ</h2>
          <div className="space-y-3">
            {s.docCounts.map((d) => (
              <div key={d.documentType} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{typeLabels[d.documentType] || d.documentType}</span>
                <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">{d._count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">รวมทั้งหมด</span>
              <span className="font-bold text-blue-600">{s.docCounts.reduce((a, b) => a + b._count, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products + Top Customers */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สินค้าขายดี (Top 8)</h2>
          <div className="space-y-3">
            {s.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.revenue / maxTopRev) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">฿{Math.round(p.revenue).toLocaleString()}</span>
              </div>
            ))}
            {s.topProducts.length === 0 && <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ลูกค้า Top 8 (ยอดสูงสุด)</h2>
          <div className="space-y-3">
            {s.topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 3 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.count} เอกสาร</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">฿{Math.round(c.revenue).toLocaleString()}</span>
              </div>
            ))}
            {s.topCustomers.length === 0 && <p className="text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>}
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">เอกสารล่าสุด</h2>
          <Link href="/documents" className="text-sm text-blue-600 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {s.recentDocs.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">{doc.documentType.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{doc.documentNo}</p>
                  <p className="text-xs text-gray-500">{doc.customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusColors[doc.status]}`}>
                  {doc.status === "DRAFT" ? "แบบร่าง" : doc.status === "SENT" ? "ส่งแล้ว" : doc.status === "PAID" ? "ชำระแล้ว" : doc.status}
                </span>
                <span className="font-bold text-gray-900 tabular-nums">฿{Number(doc.total).toLocaleString()}</span>
                <span className="text-xs text-gray-400 w-20 text-right">{doc.date.toLocaleDateString("th-TH")}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
