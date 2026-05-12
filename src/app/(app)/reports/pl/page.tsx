import { prisma } from "@/lib/prisma";

export default async function PLReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = parseInt(params.year || String(new Date().getFullYear()));

  // Revenue from Invoices (monthly)
  const invoiceRevenue = await prisma.$queryRaw<{ month: number; total: number }[]>`
    SELECT EXTRACT(MONTH FROM date)::int as month, COALESCE(SUM(total), 0)::float as total
    FROM documents
    WHERE document_type = 'INVOICE' AND status != 'CANCELLED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  // Revenue from POS (monthly)
  const posRevenue = await prisma.$queryRaw<{ month: number; total: number }[]>`
    SELECT EXTRACT(MONTH FROM date)::int as month, COALESCE(SUM(total), 0)::float as total
    FROM pos_transactions
    WHERE status = 'COMPLETED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  // Purchases / COGS (monthly)
  const purchases = await prisma.$queryRaw<{ month: number; total: number }[]>`
    SELECT EXTRACT(MONTH FROM date)::int as month, COALESCE(SUM(total), 0)::float as total
    FROM goods_receipts
    WHERE status = 'RECEIVED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];

  // Build monthly data
  const monthlyData = months.map((name, idx) => {
    const m = idx + 1;
    const invRev = invoiceRevenue.find((r) => r.month === m)?.total || 0;
    const posRev = posRevenue.find((r) => r.month === m)?.total || 0;
    const purchase = purchases.find((r) => r.month === m)?.total || 0;
    const totalRevenue = invRev + posRev;
    const grossProfit = totalRevenue - purchase;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    return { name, month: m, invRev, posRev, totalRevenue, purchase, grossProfit, margin };
  });

  // Totals
  const totals = {
    invRev: monthlyData.reduce((s, d) => s + d.invRev, 0),
    posRev: monthlyData.reduce((s, d) => s + d.posRev, 0),
    totalRevenue: monthlyData.reduce((s, d) => s + d.totalRevenue, 0),
    purchase: monthlyData.reduce((s, d) => s + d.purchase, 0),
    grossProfit: monthlyData.reduce((s, d) => s + d.grossProfit, 0),
    margin: 0,
  };
  totals.margin = totals.totalRevenue > 0 ? (totals.grossProfit / totals.totalRevenue) * 100 : 0;

  // Find max revenue for bar chart
  const maxRev = Math.max(...monthlyData.map((d) => d.totalRevenue), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานกำไร-ขาดทุน (P&L)</h1>
          <p className="text-gray-500 mt-1">ปี {year}</p>
        </div>
        <form className="flex gap-2">
          <select name="year" defaultValue={year}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">ดู</button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">รายรับรวม</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">฿{Math.round(totals.totalRevenue).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Invoice: ฿{Math.round(totals.invRev).toLocaleString()} | POS: ฿{Math.round(totals.posRev).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">ต้นทุนสินค้า (ซื้อเข้า)</p>
          <p className="text-2xl font-bold text-red-500 mt-1">฿{Math.round(totals.purchase).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">กำไรขั้นต้น</p>
          <p className={`text-2xl font-bold mt-1 ${totals.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ฿{Math.round(totals.grossProfit).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Gross Margin</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{totals.margin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">กราฟรายรับ-รายจ่ายรายเดือน</h2>
        <div className="flex items-end gap-2 h-48">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: "160px" }}>
                <div
                  className="flex-1 bg-blue-400 rounded-t"
                  style={{ height: `${(d.totalRevenue / maxRev) * 100}%`, minHeight: d.totalRevenue > 0 ? "4px" : "0" }}
                  title={`รายรับ: ฿${Math.round(d.totalRevenue).toLocaleString()}`}
                />
                <div
                  className="flex-1 bg-red-300 rounded-t"
                  style={{ height: `${(d.purchase / maxRev) * 100}%`, minHeight: d.purchase > 0 ? "4px" : "0" }}
                  title={`รายจ่าย: ฿${Math.round(d.purchase).toLocaleString()}`}
                />
              </div>
              <span className="text-xs text-gray-500">{d.name}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-4 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded" /> รายรับ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 rounded" /> รายจ่าย</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เดือน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">รายรับ (Invoice)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">รายรับ (POS)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 bg-blue-50">รายรับรวม</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ต้นทุน (ซื้อเข้า)</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 bg-green-50">กำไรขั้นต้น</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthlyData.map((d) => (
              <tr key={d.month} className={`hover:bg-gray-50 ${d.totalRevenue === 0 && d.purchase === 0 ? 'text-gray-300' : ''}`}>
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 text-right">฿{Math.round(d.invRev).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">฿{Math.round(d.posRev).toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium bg-blue-50">฿{Math.round(d.totalRevenue).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-500">฿{Math.round(d.purchase).toLocaleString()}</td>
                <td className={`px-4 py-3 text-right font-bold bg-green-50 ${d.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{Math.round(d.grossProfit).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {d.totalRevenue > 0 ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.margin >= 20 ? 'bg-green-100 text-green-700' : d.margin >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {d.margin.toFixed(1)}%
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-bold">
            <tr>
              <td className="px-4 py-3">รวมทั้งปี</td>
              <td className="px-4 py-3 text-right">฿{Math.round(totals.invRev).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">฿{Math.round(totals.posRev).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-blue-700">฿{Math.round(totals.totalRevenue).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-red-600">฿{Math.round(totals.purchase).toLocaleString()}</td>
              <td className={`px-4 py-3 text-right ${totals.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                ฿{Math.round(totals.grossProfit).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">{totals.margin.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
