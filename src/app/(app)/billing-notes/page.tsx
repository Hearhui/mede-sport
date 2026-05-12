import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function BillingNotesPage() {
  const billingNotes = await prisma.billingNote.findMany({
    include: {
      customer: true,
      items: { include: { document: { select: { documentNo: true, total: true } } } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PAID: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-600",
  };
  const statusLabels: Record<string, string> = {
    PENDING: "รอชำระ",
    PAID: "ชำระแล้ว",
    CANCELLED: "ยกเลิก",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบวางบิล</h1>
          <p className="text-gray-500 mt-1">{billingNotes.length} รายการ</p>
        </div>
        <Link href="/billing-notes/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + สร้างใบวางบิล
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ครบกำหนด</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {billingNotes.map((bn) => {
              const totalAmount = bn.items.reduce((s, i) => s + Number(i.document.total), 0);
              return (
                <tr key={bn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{bn.billingNo}</td>
                  <td className="px-4 py-3 text-gray-700">{bn.customer.name}</td>
                  <td className="px-4 py-3 text-gray-500">{bn.date.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-3 text-gray-500">{bn.dueDate?.toLocaleDateString("th-TH") || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[bn.status]}`}>
                      {statusLabels[bn.status] || bn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {bn.items.map((i) => i.document.documentNo).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">฿{totalAmount.toLocaleString()}</td>
                </tr>
              );
            })}
            {billingNotes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ยังไม่มีใบวางบิล</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
