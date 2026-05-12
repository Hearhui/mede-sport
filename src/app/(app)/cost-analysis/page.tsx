import { prisma } from "@/lib/prisma";

export default async function CostAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const sort = params.sort || "margin_desc";

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { productCode: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
        ],
        isActive: true,
      }
    : { isActive: true };

  const products = await prisma.product.findMany({
    where,
    include: {
      inventory: true,
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  // Calculate metrics
  const data = products.map((p) => {
    const sell = Number(p.sellingPrice);
    const cost = Number(p.costPrice);
    const profit = sell - cost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    const totalStock = p.inventory.reduce((s, i) => s + i.quantity, 0);
    const stockValue = totalStock * cost;
    const potentialRevenue = totalStock * sell;
    const potentialProfit = totalStock * profit;
    return { ...p, sell, cost, profit, margin, totalStock, stockValue, potentialRevenue, potentialProfit };
  });

  // Sort
  if (sort === "margin_desc") data.sort((a, b) => b.margin - a.margin);
  else if (sort === "margin_asc") data.sort((a, b) => a.margin - b.margin);
  else if (sort === "profit_desc") data.sort((a, b) => b.potentialProfit - a.potentialProfit);
  else if (sort === "cost_desc") data.sort((a, b) => b.cost - a.cost);
  else if (sort === "stock_value") data.sort((a, b) => b.stockValue - a.stockValue);

  // Summary
  const totalCost = data.reduce((s, d) => s + d.stockValue, 0);
  const totalRevenue = data.reduce((s, d) => s + d.potentialRevenue, 0);
  const totalProfit = data.reduce((s, d) => s + d.potentialProfit, 0);
  const avgMargin = data.length > 0 ? data.reduce((s, d) => s + d.margin, 0) / data.length : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">เปรียบเทียบต้นทุน</h1>
      <p className="text-gray-500 mb-6">วิเคราะห์ราคาซื้อ vs ราคาขาย, margin, มูลค่าสต็อค</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">มูลค่าสต็อค (ทุน)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">฿{Math.round(totalCost).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">มูลค่าขาย (ถ้าขายหมด)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">฿{Math.round(totalRevenue).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">กำไรที่คาดหวัง</p>
          <p className="text-2xl font-bold text-green-600 mt-1">฿{Math.round(totalProfit).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Margin เฉลี่ย</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Search + Sort */}
      <form className="flex gap-4 mb-6">
        <input type="text" name="search" defaultValue={search} placeholder="ค้นหาสินค้า..."
          className="flex-1 max-w-sm px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <select name="sort" defaultValue={sort}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm">
          <option value="margin_desc">Margin สูง→ต่ำ</option>
          <option value="margin_asc">Margin ต่ำ→สูง</option>
          <option value="profit_desc">กำไร (สต็อค) สูง→ต่ำ</option>
          <option value="cost_desc">ราคาทุนสูง→ต่ำ</option>
          <option value="stock_value">มูลค่าสต็อคสูง→ต่ำ</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">กรอง</button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาทุน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาขาย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">กำไร/หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Margin</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">สต็อค</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">มูลค่าทุน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">กำไรคาดหวัง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 truncate max-w-[250px]">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.productCode}</p>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">฿{d.cost.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium">฿{d.sell.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span className={d.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                    {d.profit > 0 ? '+' : ''}฿{d.profit.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.margin >= 25 ? 'bg-green-100 text-green-700' :
                    d.margin >= 15 ? 'bg-yellow-100 text-yellow-700' :
                    d.margin >= 0 ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {d.margin.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{d.totalStock}</td>
                <td className="px-4 py-3 text-right text-gray-600">฿{Math.round(d.stockValue).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium">
                  <span className={d.potentialProfit > 0 ? 'text-green-600' : 'text-red-600'}>
                    ฿{Math.round(d.potentialProfit).toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
