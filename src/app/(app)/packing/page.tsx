import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PackingPage() {
  const packingLists = await prisma.packingList.findMany({
    include: {
      document: { include: { customer: true } },
      boxes: { include: { items: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Get documents that can be packed (PO or INVOICE)
  const packableDocs = await prisma.document.findMany({
    where: {
      documentType: { in: ["PURCHASE_ORDER", "INVOICE", "QUOTATION"] },
      status: { not: "CANCELLED" },
    },
    include: { customer: true, _count: { select: { items: true } } },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบติดกล่อง (Packing List)</h1>
          <p className="text-gray-500 mt-1">จัดสินค้าลงกล่องและพิมพ์ป้ายติดกล่อง</p>
        </div>
      </div>

      {/* Create from document */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">สร้างใบติดกล่องจากเอกสาร</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {packableDocs.map((doc) => (
            <Link
              key={doc.id}
              href={`/packing/new?documentId=${doc.id}`}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{doc.documentNo}</p>
                  <p className="text-sm text-gray-500 mt-1">{doc.customer.name}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {doc._count.items} รายการ
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{doc.date.toLocaleDateString("th-TH")}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Existing packing lists */}
      {packingLists.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">ใบติดกล่องที่สร้างแล้ว</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เอกสารอ้างอิง</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวนกล่อง</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packingLists.map((pl) => (
                <tr key={pl.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-600">{pl.packingNo}</td>
                  <td className="px-4 py-3 text-gray-700">{pl.document.documentNo}</td>
                  <td className="px-4 py-3 text-gray-500">{pl.document.customer.name}</td>
                  <td className="px-4 py-3 text-right">{pl.totalBoxes} กล่อง</td>
                  <td className="px-4 py-3 text-gray-500">{pl.date.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-3">
                    <Link href={`/packing/${pl.id}`} className="text-blue-600 hover:underline text-sm">
                      ดู/พิมพ์
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
