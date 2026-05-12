import { prisma } from "@/lib/prisma";

export default async function CashFlowReport({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const from = params.from || new Date().toISOString().slice(0, 10);
  const to = params.to || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  // AR - เครดิตรับ (Invoice ที่ยังไม่ได้ชำระ)
  const arInvoices = await prisma.document.findMany({
    where: {
      documentType: "INVOICE",
      status: { in: ["SENT", "APPROVED"] },
      dueDate: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
    },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });

  // AP - เครดิตจ่าย (GRN ที่มี credit term — เราค้นจากเอกสารที่ต้องจ่าย)
  const apReceipts = await prisma.goodsReceipt.findMany({
    where: { status: "RECEIVED" },
    include: { supplier: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  // Upcoming payments by week
  const now = new Date();
  const weeks: { label: string; start: Date; end: Date; ar: typeof arInvoices; ap: typeof apReceipts }[] = [];
  for (let i = 0; i < 8; i++) {
    const start = new Date(now.getTime() + i * 7 * 86400000);
    const end = new Date(start.getTime() + 6 * 86400000);
    weeks.push({
      label: `สัปดาห์ ${i + 1} (${start.toLocaleDateString("th-TH", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("th-TH", { day: "numeric", month: "short" })})`,
      start, end,
      ar: arInvoices.filter((inv) => inv.dueDate && inv.dueDate >= start && inv.dueDate <= end),
      ap: [],
    });
  }

  const totalAR = arInvoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalAP = apReceipts.reduce((s, r) => s + Number(r.total), 0);

  // Revenue by period
  const revenueInvoice = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(total), 0)::float as total FROM documents
    WHERE document_type = 'INVOICE' AND status != 'CANCELLED'
    AND date >= ${new Date(from)} AND date <= ${new Date(to + "T23:59:59")}
  `;
  const revenuePOS = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(total), 0)::float as total FROM pos_transactions
    WHERE status = 'COMPLETED'
    AND date >= ${new Date(from)} AND date <= ${new Date(to + "T23:59:59")}
  `;
  const expensePurchase = await prisma.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(total), 0)::float as total FROM goods_receipts
    WHERE status = 'RECEIVED'
    AND date >= ${new Date(from)} AND date <= ${new Date(to + "T23:59:59")}
  `;

  const revenue = ((revenueInvoice as any)[0]?.total || 0) + ((revenuePOS as any)[0]?.total || 0);
  const expense = (expensePurchase as any)[0]?.total || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">วางแผนทางการเงิน (Cash Flow)</h1>
      <p className="text-gray-500 mb-6">เครดิตรับ-จ่าย และประมาณการรายรับ-รายจ่าย</p>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-end gap-4 shadow-sm print:hidden">
        <div><label className="block text-xs text-gray-500 mb-1">จากวันที่</label><input type="date" name="from" defaultValue={from} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label><input type="date" name="to" defaultValue={to} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">ดูรายงาน</button>
      </form>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-600">รายรับในช่วง</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">฿{Math.round(revenue).toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-600">รายจ่ายในช่วง</p>
          <p className="text-2xl font-bold text-red-700 mt-1">฿{Math.round(expense).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm text-green-600">เครดิตรับ (AR)</p>
          <p className="text-2xl font-bold text-green-700 mt-1">฿{Math.round(totalAR).toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-1">{arInvoices.length} Invoice ค้างรับ</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <p className="text-sm text-orange-600">เครดิตจ่าย (AP)</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">฿{Math.round(totalAP).toLocaleString()}</p>
          <p className="text-xs text-orange-500 mt-1">{apReceipts.length} รายการซื้อ</p>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">ประมาณการรายรับรายสัปดาห์ (เครดิตรับ)</h2>
        <div className="space-y-3">
          {weeks.map((w, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 w-64">{w.label}</span>
              <div className="flex-1">
                {w.ar.length > 0 ? (
                  <div className="space-y-1">
                    {w.ar.map((inv) => (
                      <div key={inv.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{inv.documentNo} — {inv.customer.name}</span>
                        <span className="font-bold text-green-600">+฿{Number(inv.total).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : <span className="text-xs text-gray-400">ไม่มีรายการ</span>}
              </div>
              <span className="font-bold text-green-700 shrink-0">฿{w.ar.reduce((s, inv) => s + Number(inv.total), 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AR Detail */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mb-6">
        <div className="px-6 py-4 border-b"><h2 className="font-bold text-gray-900">เครดิตรับ (AR) — Invoice ค้างรับ</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-2 font-medium text-gray-500">เลขที่</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">ลูกค้า</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">วันที่</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">ครบกำหนด</th>
            <th className="text-right px-4 py-2 font-medium text-gray-500">ยอดเงิน</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {arInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-blue-600 font-medium">{inv.documentNo}</td>
                <td className="px-4 py-2">{inv.customer.name}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{inv.date.toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-2 text-xs">{inv.dueDate?.toLocaleDateString("th-TH") || "-"}</td>
                <td className="px-4 py-2 text-right font-bold text-green-600">฿{Number(inv.total).toLocaleString()}</td>
              </tr>
            ))}
            {arInvoices.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">ไม่มี Invoice ค้างรับ</td></tr>}
          </tbody>
        </table>
      </div>

      {/* AP Detail */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b"><h2 className="font-bold text-gray-900">เครดิตจ่าย (AP) — รายการซื้อ</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-2 font-medium text-gray-500">เลขที่</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">ผู้ขาย</th>
            <th className="text-left px-4 py-2 font-medium text-gray-500">วันที่</th>
            <th className="text-center px-4 py-2 font-medium text-gray-500">VAT</th>
            <th className="text-right px-4 py-2 font-medium text-gray-500">ยอดเงิน</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {apReceipts.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{r.grnNumber}</td>
                <td className="px-4 py-2">{r.supplier.name}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{r.date.toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-2 text-center">{r.hasVat ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">VAT</span> : "-"}</td>
                <td className="px-4 py-2 text-right font-bold text-red-600">฿{Number(r.total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
