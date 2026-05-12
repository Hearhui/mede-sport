import { prisma } from "@/lib/prisma";

export default async function TopProductsReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
  const to = params.to || new Date().toISOString().slice(0, 10);

  const topByRevenue = await prisma.$queryRaw<{ name: string; code: string; qty: number; revenue: number; cost: number }[]>`
    SELECT p.name, p.product_code as code, SUM(di.quantity)::float as qty,
           SUM(di.amount)::float as revenue, SUM(di.quantity * p.cost_price)::float as cost
    FROM document_items di
    JOIN documents d ON d.id = di.document_id
    JOIN products p ON p.id = di.product_id
    WHERE d.document_type = 'INVOICE' AND d.status != 'CANCELLED'
      AND d.date >= ${new Date(from)} AND d.date <= ${new Date(to + "T23:59:59")}
    GROUP BY p.name, p.product_code ORDER BY revenue DESC LIMIT 30
  `;

  // POS top products
  const topPOS = await prisma.$queryRaw<{ name: string; code: string; qty: number; revenue: number }[]>`
    SELECT p.name, p.product_code as code, SUM(pti.quantity)::float as qty, SUM(pti.amount)::float as revenue
    FROM pos_transaction_items pti
    JOIN pos_transactions pt ON pt.id = pti.transaction_id
    JOIN products p ON p.id = pti.product_id
    WHERE pt.status = 'COMPLETED'
      AND pt.date >= ${new Date(from)} AND pt.date <= ${new Date(to + "T23:59:59")}
    GROUP BY p.name, p.product_code ORDER BY revenue DESC LIMIT 30
  `;

  const maxRev = Math.max(...topByRevenue.map((p) => p.revenue), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">สินค้าขายดี</h1>
      <p className="text-gray-500 mb-6">{from} ถึง {to}</p>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm print:hidden">
        <div><label className="block text-xs text-gray-500 mb-1">จากวันที่</label><input type="date" name="from" defaultValue={from} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label><input type="date" name="to" defaultValue={to} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">ดูรายงาน</button>
      </form>

      {/* Invoice Top Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top 30 สินค้าขายดี (Invoice)</h2>
        {topByRevenue.length > 0 ? (
          <div className="space-y-3">
            {topByRevenue.map((p, i) => {
              const profit = p.revenue - (p.cost || 0);
              const margin = p.revenue > 0 ? (profit / p.revenue * 100) : 0;
              return (
                <div key={p.code} className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <span className="text-sm font-bold text-gray-900 shrink-0 ml-2">฿{Math.round(p.revenue).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{Math.round(p.qty)} ชิ้น</span>
                      <span className={`text-xs shrink-0 ${margin >= 20 ? "text-green-600" : "text-orange-500"}`}>กำไร {margin.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-gray-400 text-center py-8">ไม่มีข้อมูลในช่วงนี้</p>}
      </div>

      {/* POS Top Products */}
      {topPOS.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top สินค้าขายหน้าร้าน (POS)</h2>
          <table className="w-full text-sm">
            <thead className="border-b"><tr>
              <th className="text-left py-2 text-gray-500">#</th>
              <th className="text-left py-2 text-gray-500">สินค้า</th>
              <th className="text-right py-2 text-gray-500">จำนวน</th>
              <th className="text-right py-2 text-gray-500">รายได้</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {topPOS.map((p, i) => (
                <tr key={p.code}>
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 text-right">{Math.round(p.qty)}</td>
                  <td className="py-2 text-right font-bold">฿{Math.round(p.revenue).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
