import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PosHistoryPage() {
  const transactions = await prisma.posTransaction.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const todayTotal = transactions
    .filter((t) => t.date.toDateString() === new Date().toDateString() && t.status === "COMPLETED")
    .reduce((s, t) => s + Number(t.total), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ประวัติการขาย POS</h1>
          <p className="text-gray-500 mt-1">ยอดขายวันนี้: <span className="font-bold text-green-600">฿{todayTotal.toLocaleString()}</span></p>
        </div>
        <Link href="/pos" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          → ไปหน้าขาย POS
        </Link>
      </div>

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
              <th className="text-left px-4 py-3 font-medium text-gray-500">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-blue-600 font-medium">{t.transactionNo}</td>
                <td className="px-4 py-3 text-gray-500">{t.createdAt.toLocaleString("th-TH")}</td>
                <td className="px-4 py-3 text-gray-700">{t.customer?.name || "ลูกค้าทั่วไป"}</td>
                <td className="px-4 py-3 text-right text-gray-500">{t.items.length}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{t.paymentMethod === "CASH" ? "เงินสด" : "โอน"}</span></td>
                <td className="px-4 py-3 text-right font-bold">฿{Number(t.total).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${t.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {t.status === "COMPLETED" ? "สำเร็จ" : "ยกเลิก"}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ยังไม่มีรายการขาย</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
