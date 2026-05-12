import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InventoryMovementReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; type?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const to = params.to || new Date().toISOString().slice(0, 10);
  const typeFilter = params.type || "";

  const where: any = {
    createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
  };
  if (typeFilter) where.movementType = typeFilter;

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: { product: true, location: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const summary = {
    totalIn: movements.filter((m) => m.movementType === "IN").reduce((s, m) => s + m.quantity, 0),
    totalOut: movements.filter((m) => m.movementType === "OUT").reduce((s, m) => s + m.quantity, 0),
    totalAdj: movements.filter((m) => m.movementType === "ADJUSTMENT").reduce((s, m) => s + m.quantity, 0),
    countIn: movements.filter((m) => m.movementType === "IN").length,
    countOut: movements.filter((m) => m.movementType === "OUT").length,
  };

  const typeColors: Record<string, string> = {
    IN: "bg-green-100 text-green-700",
    OUT: "bg-red-100 text-red-700",
    ADJUSTMENT: "bg-yellow-100 text-yellow-700",
    TRANSFER: "bg-blue-100 text-blue-700",
  };
  const typeLabels: Record<string, string> = { IN: "รับเข้า", OUT: "จ่ายออก", ADJUSTMENT: "ปรับยอด", TRANSFER: "โอนย้าย" };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">รายงานสินค้ารับเข้า-จ่ายออก</h1>
      <p className="text-gray-500 mb-6">{from} ถึง {to}</p>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm print:hidden">
        <div><label className="block text-xs text-gray-500 mb-1">จากวันที่</label><input type="date" name="from" defaultValue={from} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label><input type="date" name="to" defaultValue={to} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ประเภท</label>
          <select name="type" defaultValue={typeFilter} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            <option value="">ทั้งหมด</option>
            <option value="IN">รับเข้า</option>
            <option value="OUT">จ่ายออก</option>
            <option value="ADJUSTMENT">ปรับยอด</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">กรอง</button>
      </form>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm text-green-600 font-medium">รับเข้า</p>
          <p className="text-2xl font-bold text-green-700 mt-1">+{summary.totalIn.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">{summary.countIn} รายการ</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-600 font-medium">จ่ายออก</p>
          <p className="text-2xl font-bold text-red-700 mt-1">-{summary.totalOut.toLocaleString()}</p>
          <p className="text-xs text-red-500 mt-1">{summary.countOut} รายการ</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-600 font-medium">สุทธิ</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{(summary.totalIn - summary.totalOut).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">วันที่</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">ประเภท</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">สินค้า</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">คลัง</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">จำนวน</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">หมายเหตุ</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-500 text-xs">{m.createdAt.toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[m.movementType]}`}>{typeLabels[m.movementType]}</span></td>
                <td className="px-4 py-2 font-medium">{m.product.name}</td>
                <td className="px-4 py-2 font-mono text-xs">{m.location.code}</td>
                <td className="px-4 py-2 text-right font-bold"><span className={m.movementType === "IN" ? "text-green-600" : "text-red-600"}>{m.movementType === "IN" ? "+" : "-"}{m.quantity}</span></td>
                <td className="px-4 py-2 text-gray-400 text-xs truncate max-w-[200px]">{m.note || "-"}</td>
              </tr>
            ))}
            {movements.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">ไม่พบรายการในช่วงนี้</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
