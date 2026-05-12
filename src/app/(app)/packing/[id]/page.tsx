import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "./PrintButton";

export default async function PackingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const packingList = await prisma.packingList.findUnique({
    where: { id: parseInt(id) },
    include: {
      document: { include: { customer: true } },
      boxes: {
        orderBy: { boxNumber: "asc" },
        include: { items: { include: { documentItem: true } } },
      },
    },
  });

  if (!packingList) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/packing" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← กลับรายการใบติดกล่อง
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{packingList.packingNo}</h1>
          <p className="text-gray-500 mt-1">
            อ้างอิง {packingList.document.documentNo} — {packingList.document.customer.name}
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Printable area */}
      <div id="print-area" className="space-y-6">
        {packingList.boxes.map((box) => (
          <div key={box.id} className="bg-white rounded-xl border-2 border-gray-300 p-6 print:break-inside-avoid print:border-black">
            {/* Box Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-200 print:border-black">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center print:bg-black">
                  <span className="text-white font-bold text-2xl">{box.boxNumber}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{box.boxLabel}</h2>
                  <p className="text-sm text-gray-500">
                    {packingList.packingNo} | {packingList.document.customer.name}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                {box.weight && <p>น้ำหนัก: {box.weight}</p>}
                {box.dimensions && <p>ขนาด: {box.dimensions}</p>}
              </div>
            </div>

            {/* Box Items */}
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 font-medium text-gray-600">รายการสินค้า</th>
                  <th className="text-right py-2 font-medium text-gray-600">จำนวน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {box.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-3 text-gray-400">{idx + 1}</td>
                    <td className="py-3 font-medium text-gray-900">{item.documentItem.description}</td>
                    <td className="py-3 text-right font-bold text-lg">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm text-gray-500">
              <span>กล่องที่ {box.boxNumber} จาก {packingList.totalBoxes} กล่อง</span>
              <span>{packingList.date.toLocaleDateString("th-TH")}</span>
            </div>
          </div>
        ))}
      </div>

      {packingList.notes && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:hidden">
          <p className="text-sm text-yellow-800">{packingList.notes}</p>
        </div>
      )}
    </div>
  );
}
