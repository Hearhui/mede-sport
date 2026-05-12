import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GoodsReceiptPage() {
  const receipts = await prisma.goodsReceipt.findMany({
    include: {
      supplier: true,
      location: true,
      items: { include: { product: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รับเข้าสินค้า</h1>
          <p className="text-gray-500 mt-1">{receipts.length} รายการ</p>
        </div>
        <Link
          href="/goods-receipt/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + รับเข้าสินค้าใหม่
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">คลัง</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">VAT</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">รายการ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {receipts.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-blue-600">{r.grnNumber}</td>
                <td className="px-4 py-3 text-gray-500">{r.date.toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-3 text-gray-700">{r.supplier.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 font-mono">{r.location?.code || "-"}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.hasVat ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">VAT 7%</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">ไม่มี</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{r.items.length}</td>
                <td className="px-4 py-3 text-right font-semibold">฿{Number(r.total).toLocaleString()}</td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ยังไม่มีรายการรับเข้า</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
