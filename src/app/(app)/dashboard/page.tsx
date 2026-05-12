import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getStats() {
  const [productCount, customerCount, inventoryValue, recentDocs, monthlySales] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count(),
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(i.quantity * p.cost_price), 0)::float as total
        FROM inventory i JOIN products p ON p.id = i.product_id
      `,
      prisma.document.findMany({
        take: 10,
        orderBy: { date: "desc" },
        include: { customer: true, items: true },
      }),
      prisma.$queryRaw<{ month: string; total: number }[]>`
        SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(total)::float as total
        FROM documents
        WHERE document_type = 'INVOICE'
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 6
      `,
    ]);

  const lowStock = await prisma.inventory.count({
    where: { quantity: { lte: 2 }, product: { isActive: true } },
  });

  const docCounts = await prisma.document.groupBy({
    by: ["documentType"],
    _count: true,
  });

  return {
    productCount,
    customerCount,
    inventoryValue: (inventoryValue as any)[0]?.total || 0,
    lowStock,
    recentDocs,
    monthlySales,
    docCounts,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "สินค้าทั้งหมด",
      value: stats.productCount.toLocaleString(),
      sub: `${stats.lowStock} รายการ สต็อคต่ำ`,
      color: "blue",
      href: "/products",
    },
    {
      label: "ลูกค้า",
      value: stats.customerCount.toLocaleString(),
      sub: "รายชื่อลูกค้าทั้งหมด",
      color: "green",
      href: "/customers",
    },
    {
      label: "มูลค่าสต็อค",
      value: `฿${Math.round(stats.inventoryValue).toLocaleString()}`,
      sub: "มูลค่ารวม (ต้นทุน)",
      color: "purple",
      href: "/inventory",
    },
    {
      label: "เอกสารทั้งหมด",
      value: stats.docCounts.reduce((s, d) => s + d._count, 0).toLocaleString(),
      sub: stats.docCounts.map((d) => `${d.documentType}: ${d._count}`).join(", "),
      color: "orange",
      href: "/documents",
    },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const typeLabels: Record<string, string> = {
    QUOTATION: "ใบเสนอราคา",
    PURCHASE_ORDER: "ใบสั่งซื้อ",
    INVOICE: "ใบกำกับภาษี",
    RECEIPT: "ใบเสร็จรับเงิน",
    DELIVERY_NOTE: "ใบส่งของ",
    CREDIT_NOTE: "ใบลดหนี้",
    DEBIT_NOTE: "ใบเพิ่มหนี้",
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    PAID: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "แบบร่าง",
    SENT: "ส่งแล้ว",
    APPROVED: "อนุมัติ",
    PAID: "ชำระแล้ว",
    CANCELLED: "ยกเลิก",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-500 mt-1">ภาพรวมระบบ มีดี สปอร์ต</p>
        </div>
        <Link
          href="/documents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + สร้างใบเสนอราคา
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`p-6 rounded-xl border ${colorMap[card.color]} hover:shadow-md transition-shadow`}
          >
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
            <p className="text-xs mt-2 opacity-60">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Monthly Sales */}
      {stats.monthlySales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ยอดขายรายเดือน (Invoice)</h2>
          <div className="grid grid-cols-6 gap-4">
            {stats.monthlySales.reverse().map((m) => (
              <div key={m.month} className="text-center">
                <p className="text-xs text-gray-500">{m.month}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  ฿{Math.round(m.total).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Documents */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">เอกสารล่าสุด</h2>
          <Link href="/documents" className="text-sm text-blue-600 hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentDocs.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-gray-900">{doc.documentNo}</p>
                  <p className="text-sm text-gray-500">{doc.customer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {typeLabels[doc.documentType] || doc.documentType}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[doc.status]}`}>
                  {statusLabels[doc.status] || doc.status}
                </span>
                <span className="font-semibold text-gray-900">
                  ฿{Number(doc.total).toLocaleString()}
                </span>
                <span className="text-sm text-gray-400">
                  {doc.date.toLocaleDateString("th-TH")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
