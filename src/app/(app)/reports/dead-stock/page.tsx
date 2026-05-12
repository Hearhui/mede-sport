import { prisma } from "@/lib/prisma";

export default async function DeadStockReport({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = parseInt(params.days || "90");

  // Get all products with stock
  const productsWithStock = await prisma.product.findMany({
    where: { isActive: true, inventory: { some: { quantity: { gt: 0 } } } },
    include: {
      inventory: { include: { location: true } },
    },
  });

  // Get last movement date for each product
  const lastMovements = await prisma.$queryRaw<{ product_id: number; last_out: Date | null; last_in: Date | null }[]>`
    SELECT product_id,
      MAX(CASE WHEN movement_type = 'OUT' THEN created_at END) as last_out,
      MAX(CASE WHEN movement_type = 'IN' THEN created_at END) as last_in
    FROM inventory_movements
    GROUP BY product_id
  `;

  const movementMap = new Map(lastMovements.map((m) => [m.product_id, m]));

  // Default receive date: 1 Jan 2026 (1/1/2569)
  const defaultReceiveDate = new Date("2026-01-01");
  const cutoffDate = new Date(Date.now() - days * 86400000);

  const deadStock = productsWithStock.map((p) => {
    const totalQty = p.inventory.reduce((s, i) => s + i.quantity, 0);
    const stockValue = totalQty * Number(p.costPrice);
    const movement = movementMap.get(p.id);
    const lastSaleDate = movement?.last_out || null;
    const lastReceiveDate = movement?.last_in || defaultReceiveDate;
    const daysSinceLastSale = lastSaleDate ? Math.floor((Date.now() - new Date(lastSaleDate).getTime()) / 86400000) : 999;
    const neverSold = !lastSaleDate;
    const isDeadStock = neverSold || daysSinceLastSale > days;

    return {
      ...p, totalQty, stockValue, lastSaleDate, lastReceiveDate, daysSinceLastSale, neverSold, isDeadStock,
      locations: p.inventory.filter((i) => i.quantity > 0).map((i) => `${i.location.code}(${i.quantity})`).join(", "),
    };
  })
    .filter((p) => p.isDeadStock)
    .sort((a, b) => b.stockValue - a.stockValue);

  const totalDeadValue = deadStock.reduce((s, p) => s + p.stockValue, 0);
  const totalDeadQty = deadStock.reduce((s, p) => s + p.totalQty, 0);
  const neverSoldCount = deadStock.filter((p) => p.neverSold).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">สินค้าค้าง Stock (Dead Stock)</h1>
      <p className="text-gray-500 mb-6">สินค้าที่ไม่เคลื่อนไหว (ไม่มีการขาย) เกิน {days} วัน</p>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm print:hidden">
        <div>
          <label className="block text-xs text-gray-500 mb-1">ไม่เคลื่อนไหวเกิน (วัน)</label>
          <select name="days" defaultValue={days} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            <option value="30">30 วัน</option>
            <option value="60">60 วัน</option>
            <option value="90">90 วัน</option>
            <option value="180">180 วัน</option>
            <option value="365">365 วัน</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">ดูรายงาน</button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-600">สินค้าค้าง</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{deadStock.length} รายการ</p>
          <p className="text-xs text-red-500 mt-1">จาก {productsWithStock.length} รายการที่มีสต็อค</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <p className="text-sm text-orange-600">มูลค่าสต็อคค้าง</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">฿{Math.round(totalDeadValue).toLocaleString()}</p>
          <p className="text-xs text-orange-500 mt-1">{totalDeadQty} ชิ้น</p>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
          <p className="text-sm text-gray-600">ไม่เคยขายเลย</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{neverSoldCount} รายการ</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500">สินค้า</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">ตำแหน่ง</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">สต็อค</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">มูลค่า (ทุน)</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">วันรับเข้า</th>
            <th className="text-left px-4 py-3 font-medium text-gray-500">ขายครั้งสุดท้าย</th>
            <th className="text-right px-4 py-3 font-medium text-gray-500">วันที่ไม่ขาย</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {deadStock.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.productCode}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{p.locations}</td>
                <td className="px-4 py-3 text-right font-medium">{p.totalQty} {p.unit}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">฿{Math.round(p.stockValue).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(p.lastReceiveDate).toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-3">
                  {p.neverSold ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">ไม่เคยขาย</span>
                  ) : (
                    <span className="text-xs text-gray-500">{new Date(p.lastSaleDate!).toLocaleDateString("th-TH")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-bold ${p.daysSinceLastSale > 180 ? 'text-red-600' : 'text-orange-500'}`}>
                    {p.neverSold ? "∞" : `${p.daysSinceLastSale} วัน`}
                  </span>
                </td>
              </tr>
            ))}
            {deadStock.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ไม่มีสินค้าค้าง Stock ในเกณฑ์นี้</td></tr>}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4">* สินค้าที่ไม่ทราบวันรับเข้า กำหนดเป็น 1 มกราคม 2569 (1/1/2026)</p>
    </div>
  );
}
