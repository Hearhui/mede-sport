import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PosHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || "";
  const to = params.to || "";

  const where: any = { status: "COMPLETED" };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59");
  }

  const transactions = await prisma.posTransaction.findMany({
    where,
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalRevenue = transactions.reduce((s, t) => s + Number(t.total), 0);
  const todayTotal = transactions
    .filter((t) => t.date.toDateString() === new Date().toDateString())
    .reduce((s, t) => s + Number(t.total), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการขาย POS</h1>
          <p className="text-gray-500 mt-1">
            ยอดวันนี้: <span className="font-bold text-green-600">฿{todayTotal.toLocaleString()}</span>
            {(from || to) && <> | กรอง: <span className="font-bold text-blue-600">฿{totalRevenue.toLocaleString()}</span> ({transactions.length} รายการ)</>}
          </p>
        </div>
        <Link href="/pos" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          → ไปหน้าขาย POS
        </Link>
      </div>

      {/* Date Range Filter */}
      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">จากวันที่</label>
          <input type="date" name="from" defaultValue={from}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label>
          <input type="date" name="to" defaultValue={to}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          กรอง
        </button>
        {(from || to) && (
          <Link href="/pos/history" className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">ล้างตัวกรอง</Link>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">เลขที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">วันที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ลูกค้า</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">รายการ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ชำระ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">ยอดรวม</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-blue-600 font-medium">{t.transactionNo}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{t.createdAt.toLocaleString("th-TH")}</td>
                <td className="px-4 py-3 text-gray-700">{t.customer?.name || "ลูกค้าทั่วไป"}</td>
                <td className="px-4 py-3 text-right text-gray-500">{t.items.length}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{t.paymentMethod === "CASH" ? "เงินสด" : "โอน"}</span></td>
                <td className="px-4 py-3 text-right font-bold">฿{Number(t.total).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/pos/receipt/${t.id}`} className="text-blue-600 hover:underline text-xs">พิมพ์</Link>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ไม่พบรายการ</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
