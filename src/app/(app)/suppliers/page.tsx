import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { purchaseOrders: true, goodsReceipts: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผู้ขาย (Supplier)</h1>
          <p className="text-gray-500 mt-1">{suppliers.length} ราย</p>
        </div>
        <Link href="/suppliers/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + เพิ่มผู้ขาย
        </Link>
      </div>

      <form className="mb-6">
        <input type="text" name="search" placeholder="ค้นหาผู้ขาย..."
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อผู้ขาย</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ที่อยู่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">โทร</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tax ID</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">รับเข้า</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.supplierCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                  {[s.addressLine1, s.district, s.province].filter(Boolean).join(" ")}
                </td>
                <td className="px-4 py-3 text-gray-500">{s.phone || "-"}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.taxId || "-"}</td>
                <td className="px-4 py-3 text-right text-gray-500">{s._count.goodsReceipts}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/suppliers/${s.id}`} className="text-blue-600 hover:underline text-sm">แก้ไข</Link>
                    <DeleteButton apiUrl={`/api/suppliers/${s.id}`} itemName={s.name} />
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ยังไม่มีผู้ขาย — <Link href="/suppliers/new" className="text-blue-600 hover:underline">เพิ่มผู้ขายคนแรก</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
