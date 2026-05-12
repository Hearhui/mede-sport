import { prisma } from "@/lib/prisma";

export default async function VatReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const year = parseInt(params.year || String(new Date().getFullYear()));

  // VAT ขาย (Output VAT) - from Invoices with VAT
  const vatOutput = await prisma.$queryRaw<{ month: number; vat: number; revenue: number }[]>`
    SELECT
      EXTRACT(MONTH FROM date)::int as month,
      COALESCE(SUM(vat_amount), 0)::float as vat,
      COALESCE(SUM(total), 0)::float as revenue
    FROM documents
    WHERE document_type = 'INVOICE'
      AND status != 'CANCELLED'
      AND vat_type != 'NO_VAT'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  // VAT ซื้อ (Input VAT) - from Goods Receipts with VAT
  const vatInput = await prisma.$queryRaw<{ month: number; vat: number; purchase: number }[]>`
    SELECT
      EXTRACT(MONTH FROM date)::int as month,
      COALESCE(SUM(vat_amount), 0)::float as vat,
      COALESCE(SUM(total), 0)::float as purchase
    FROM goods_receipts
    WHERE has_vat = true
      AND status = 'RECEIVED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  // VAT from POS (included in total, assumed IN_VAT)
  const vatPos = await prisma.$queryRaw<{ month: number; vat: number; revenue: number }[]>`
    SELECT
      EXTRACT(MONTH FROM date)::int as month,
      COALESCE(SUM(vat_amount), 0)::float as vat,
      COALESCE(SUM(total), 0)::float as revenue
    FROM pos_transactions
    WHERE status = 'COMPLETED'
      AND EXTRACT(YEAR FROM date) = ${year}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `;

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const monthlyData = months.map((name, idx) => {
    const m = idx + 1;
    const outInv = vatOutput.find((r) => r.month === m);
    const outPos = vatPos.find((r) => r.month === m);
    const inp = vatInput.find((r) => r.month === m);

    const outputVat = (outInv?.vat || 0) + (outPos?.vat || 0);
    const inputVat = inp?.vat || 0;
    const netVat = outputVat - inputVat;
    const salesRevenue = (outInv?.revenue || 0) + (outPos?.revenue || 0);
    const purchaseAmount = inp?.purchase || 0;

    return { name, month: m, outputVat, inputVat, netVat, salesRevenue, purchaseAmount };
  });

  const totals = {
    outputVat: monthlyData.reduce((s, d) => s + d.outputVat, 0),
    inputVat: monthlyData.reduce((s, d) => s + d.inputVat, 0),
    netVat: monthlyData.reduce((s, d) => s + d.netVat, 0),
    salesRevenue: monthlyData.reduce((s, d) => s + d.salesRevenue, 0),
    purchaseAmount: monthlyData.reduce((s, d) => s + d.purchaseAmount, 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สรุป VAT รายเดือน</h1>
          <p className="text-gray-500 mt-1">ปี {year} — VAT ขาย - VAT ซื้อ = VAT ที่ต้องจ่าย</p>
        </div>
        <form>
          <select name="year" defaultValue={year}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">ดู</button>
        </form>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border-2 border-red-200 p-6">
          <p className="text-sm text-red-500 font-medium">VAT ขาย (Output VAT)</p>
          <p className="text-3xl font-bold text-red-600 mt-2">฿{Math.round(totals.outputVat).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">จากยอดขาย ฿{Math.round(totals.salesRevenue).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border-2 border-green-200 p-6">
          <p className="text-sm text-green-500 font-medium">VAT ซื้อ (Input VAT)</p>
          <p className="text-3xl font-bold text-green-600 mt-2">฿{Math.round(totals.inputVat).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-2">จากยอดซื้อ ฿{Math.round(totals.purchaseAmount).toLocaleString()}</p>
        </div>
        <div className={`bg-white rounded-xl border-2 p-6 ${totals.netVat >= 0 ? 'border-orange-200' : 'border-blue-200'}`}>
          <p className={`text-sm font-medium ${totals.netVat >= 0 ? 'text-orange-500' : 'text-blue-500'}`}>
            {totals.netVat >= 0 ? 'VAT ที่ต้องจ่าย' : 'VAT ที่ขอคืนได้'}
          </p>
          <p className={`text-3xl font-bold mt-2 ${totals.netVat >= 0 ? 'text-orange-600' : 'text-blue-600'}`}>
            ฿{Math.round(Math.abs(totals.netVat)).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-2">VAT ขาย - VAT ซื้อ = สุทธิ</p>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เดือน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดขาย (มี VAT)</th>
              <th className="text-right px-4 py-3 font-medium text-red-600 bg-red-50">VAT ขาย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดซื้อ (มี VAT)</th>
              <th className="text-right px-4 py-3 font-medium text-green-600 bg-green-50">VAT ซื้อ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 bg-orange-50">VAT ต้องจ่าย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {monthlyData.map((d) => {
              const hasData = d.outputVat > 0 || d.inputVat > 0;
              return (
                <tr key={d.month} className={`hover:bg-gray-50 ${!hasData ? 'text-gray-300' : ''}`}>
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-right">฿{Math.round(d.salesRevenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-600 bg-red-50 font-medium">
                    ฿{Math.round(d.outputVat).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">฿{Math.round(d.purchaseAmount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-600 bg-green-50 font-medium">
                    ฿{Math.round(d.inputVat).toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold bg-orange-50 ${
                    d.netVat > 0 ? 'text-orange-600' : d.netVat < 0 ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {d.netVat !== 0 ? `฿${Math.round(Math.abs(d.netVat)).toLocaleString()}` : '-'}
                    {d.netVat < 0 && ' (คืน)'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300 font-bold">
            <tr>
              <td className="px-4 py-3">รวมทั้งปี</td>
              <td className="px-4 py-3 text-right">฿{Math.round(totals.salesRevenue).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-red-700">฿{Math.round(totals.outputVat).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">฿{Math.round(totals.purchaseAmount).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-green-700">฿{Math.round(totals.inputVat).toLocaleString()}</td>
              <td className={`px-4 py-3 text-right text-lg ${totals.netVat >= 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                ฿{Math.round(Math.abs(totals.netVat)).toLocaleString()}
                {totals.netVat < 0 && ' (คืน)'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">สูตรคำนวณ VAT</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>VAT ขาย</strong> = ภาษีมูลค่าเพิ่มจากใบกำกับภาษีที่ออก (Invoice + POS)</p>
          <p><strong>VAT ซื้อ</strong> = ภาษีมูลค่าเพิ่มจากใบกำกับภาษีที่ได้รับ (Goods Receipt ที่มี VAT)</p>
          <p><strong>VAT ต้องจ่าย</strong> = VAT ขาย - VAT ซื้อ (ถ้าติดลบ = ขอคืนได้)</p>
        </div>
      </div>
    </div>
  );
}
