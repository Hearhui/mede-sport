import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PLReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const year = parseInt(params.year || String(new Date().getFullYear()));
  const fromMonth = parseInt(params.from || "1");
  const toMonth = parseInt(params.to || "12");

  // Revenue from Invoices
  const invoiceRevenue = await prisma.$queryRaw<{ month: number; total: number; count: number }[]>`
    SELECT EXTRACT(MONTH FROM date)::int as month, COALESCE(SUM(total),0)::float as total, COUNT(*)::int as count
    FROM documents WHERE document_type = 'INVOICE' AND status != 'CANCELLED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date) ORDER BY month
  `;

  // Revenue from POS
  const posRevenue = await prisma.$queryRaw<{ month: number; total: number; count: number }[]>`
    SELECT EXTRACT(MONTH FROM date)::int as month, COALESCE(SUM(total),0)::float as total, COUNT(*)::int as count
    FROM pos_transactions WHERE status = 'COMPLETED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date) ORDER BY month
  `;

  // Purchases (COGS)
  const purchases = await prisma.$queryRaw<{ month: number; total: number; count: number }[]>`
    SELECT EXTRACT(MONTH FROM date)::int as month, COALESCE(SUM(total),0)::float as total, COUNT(*)::int as count
    FROM goods_receipts WHERE status = 'RECEIVED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date) ORDER BY month
  `;

  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const monthlyData = months.map((name, idx) => {
    const m = idx + 1;
    const inv = invoiceRevenue.find((r) => r.month === m);
    const pos = posRevenue.find((r) => r.month === m);
    const pur = purchases.find((r) => r.month === m);
    const invRev = inv?.total || 0;
    const posRev = pos?.total || 0;
    const purchase = pur?.total || 0;
    const totalRevenue = invRev + posRev;
    const grossProfit = totalRevenue - purchase;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    return {
      name, month: m, invRev, posRev, totalRevenue, purchase, grossProfit, margin,
      invCount: inv?.count || 0, posCount: pos?.count || 0, purCount: pur?.count || 0,
    };
  }).filter((d) => d.month >= fromMonth && d.month <= toMonth);

  const totals = {
    invRev: monthlyData.reduce((s, d) => s + d.invRev, 0),
    posRev: monthlyData.reduce((s, d) => s + d.posRev, 0),
    totalRevenue: monthlyData.reduce((s, d) => s + d.totalRevenue, 0),
    purchase: monthlyData.reduce((s, d) => s + d.purchase, 0),
    grossProfit: monthlyData.reduce((s, d) => s + d.grossProfit, 0),
    invCount: monthlyData.reduce((s, d) => s + d.invCount, 0),
    posCount: monthlyData.reduce((s, d) => s + d.posCount, 0),
    margin: 0,
  };
  totals.margin = totals.totalRevenue > 0 ? (totals.grossProfit / totals.totalRevenue) * 100 : 0;

  const maxRev = Math.max(...monthlyData.map((d) => d.totalRevenue), 1);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานกำไร-ขาดทุน (P&L)</h1>
          <p className="text-gray-500 mt-1">ปี {year} | เดือน {months[fromMonth - 1]} - {months[toMonth - 1]}</p>
        </div>
        <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium print:hidden">
          พิมพ์ / PDF
        </button>
      </div>

      {/* Date Range Filter */}
      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm print:hidden">
        <div>
          <label className="block text-xs text-gray-500 mb-1">ปี</label>
          <select name="year" defaultValue={year} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">จากเดือน</label>
          <select name="from" defaultValue={fromMonth} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ถึงเดือน</label>
          <select name="to" defaultValue={toMonth} className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">ดูรายงาน</button>
      </form>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500">รายรับ Invoice</p>
          <p className="text-xl font-bold text-blue-600 mt-1">฿{Math.round(totals.invRev).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{totals.invCount} ฉบับ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500">รายรับ POS</p>
          <p className="text-xl font-bold text-green-600 mt-1">฿{Math.round(totals.posRev).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{totals.posCount} รายการ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500">รายรับรวม</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">฿{Math.round(totals.totalRevenue).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500">ต้นทุน (ซื้อเข้า)</p>
          <p className="text-xl font-bold text-red-500 mt-1">฿{Math.round(totals.purchase).toLocaleString()}</p>
        </div>
        <div className={`rounded-xl border p-5 shadow-sm ${totals.grossProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500">กำไรขั้นต้น ({totals.margin.toFixed(1)}%)</p>
          <p className={`text-xl font-bold mt-1 ${totals.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ฿{Math.round(totals.grossProfit).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">กราฟรายรับ-รายจ่าย</h2>
        <div className="flex items-end gap-2 h-48">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-700">฿{Math.round(d.totalRevenue / 1000)}k</span>
              <div className="w-full flex gap-0.5 items-end" style={{ height: "140px" }}>
                <div className="flex-1 bg-blue-400 rounded-t" style={{ height: `${Math.max(2, (d.invRev / maxRev) * 100)}%` }} title={`Invoice: ฿${Math.round(d.invRev).toLocaleString()}`} />
                <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${Math.max(0, (d.posRev / maxRev) * 100)}%` }} title={`POS: ฿${Math.round(d.posRev).toLocaleString()}`} />
                <div className="flex-1 bg-red-300 rounded-t" style={{ height: `${Math.max(0, (d.purchase / maxRev) * 100)}%` }} title={`ซื้อเข้า: ฿${Math.round(d.purchase).toLocaleString()}`} />
              </div>
              <span className="text-xs text-gray-500">{d.name}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-4 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded" /> Invoice</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> POS</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 rounded" /> ซื้อเข้า</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เดือน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">POS</th>
              <th className="text-right px-4 py-3 font-medium text-blue-600 bg-blue-50">รายรับรวม</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ซื้อเข้า</th>
              <th className="text-right px-4 py-3 font-medium text-green-600 bg-green-50">กำไรขั้นต้น</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthlyData.map((d) => (
              <tr key={d.month} className={`hover:bg-gray-50 ${d.totalRevenue === 0 && d.purchase === 0 ? 'text-gray-300' : ''}`}>
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 text-right">
                  <span>฿{Math.round(d.invRev).toLocaleString()}</span>
                  {d.invCount > 0 && <span className="text-xs text-gray-400 ml-1">({d.invCount})</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <span>฿{Math.round(d.posRev).toLocaleString()}</span>
                  {d.posCount > 0 && <span className="text-xs text-gray-400 ml-1">({d.posCount})</span>}
                </td>
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
              <td className="px-4 py-3">รวม</td>
              <td className="px-4 py-3 text-right">฿{Math.round(totals.invRev).toLocaleString()} <span className="text-xs font-normal text-gray-400">({totals.invCount})</span></td>
              <td className="px-4 py-3 text-right">฿{Math.round(totals.posRev).toLocaleString()} <span className="text-xs font-normal text-gray-400">({totals.posCount})</span></td>
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
