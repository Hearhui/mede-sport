"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Period = "today" | "week" | "month" | "quarter" | "half" | "year" | "custom";

function getPeriodDates(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const d = new Date();
  switch (period) {
    case "today": return { from: to, to };
    case "week": d.setDate(d.getDate() - 7); return { from: d.toISOString().slice(0, 10), to };
    case "month": d.setMonth(d.getMonth() - 1); return { from: d.toISOString().slice(0, 10), to };
    case "quarter": d.setMonth(d.getMonth() - 3); return { from: d.toISOString().slice(0, 10), to };
    case "half": d.setMonth(d.getMonth() - 6); return { from: d.toISOString().slice(0, 10), to };
    case "year": d.setFullYear(d.getFullYear() - 1); return { from: d.toISOString().slice(0, 10), to };
    default: return { from: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), to };
  }
}

const periodLabels: Record<Period, string> = {
  today: "วันนี้", week: "7 วัน", month: "เดือนนี้",
  quarter: "ไตรมาส", half: "ครึ่งปี", year: "ปีนี้", custom: "กำหนดเอง",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const dates = period === "custom" ? { from, to } : getPeriodDates(period);
    if (!dates.from || !dates.to) return;
    const res = await fetch(`/api/dashboard?from=${dates.from}&to=${dates.to}`);
    setData(await res.json());
  }, [period, from, to]);

  useEffect(() => {
    if (period !== "custom") {
      const dates = getPeriodDates(period);
      setFrom(dates.from);
      setTo(dates.to);
    }
    fetchData();
  }, [period, fetchData]);

  if (!data) return <div className="p-8 text-gray-400">กำลังโหลด Dashboard...</div>;

  const k = data.kpi;
  const totalRevenue = k.invoiceRevenue + k.posRevenue;
  const grossProfit = totalRevenue - k.purchaseTotal;
  const maxChart = Math.max(...data.dailyRevenue.map((d: any) => d.invoice + d.pos), 1);

  // Aggregate chart data for readability
  const chartData = data.dailyRevenue.length > 60
    ? aggregateByMonth(data.dailyRevenue)
    : data.dailyRevenue.length > 14
    ? aggregateByWeek(data.dailyRevenue)
    : data.dailyRevenue;
  const maxAgg = Math.max(...chartData.map((d: any) => d.invoice + d.pos), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {data.period.from} — {data.period.to}
          </p>
        </div>
        <Link href="/documents/new"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm">
          + สร้างใบเสนอราคา
        </Link>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-white rounded-xl border border-gray-200 p-2">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              period === p ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
            }`}>
            {periodLabels[p]}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
            <span className="text-gray-400">—</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
            <button onClick={fetchData} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">ดู</button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="รายรับ Invoice" value={`฿${Math.round(k.invoiceRevenue).toLocaleString()}`}
          sub={`${k.invoiceCount} ฉบับ`} color="from-blue-500 to-blue-600" icon="📄" />
        <KpiCard label="รายรับ POS" value={`฿${Math.round(k.posRevenue).toLocaleString()}`}
          sub={`${k.posCount} รายการ`} color="from-green-500 to-emerald-600" icon="🏪" />
        <KpiCard label="ซื้อเข้า (ต้นทุน)" value={`฿${Math.round(k.purchaseTotal).toLocaleString()}`}
          sub={`${k.purchaseCount} รายการ`} color="from-red-400 to-red-500" icon="📦" />
        <KpiCard label="กำไรขั้นต้น" value={`฿${Math.round(grossProfit).toLocaleString()}`}
          sub={totalRevenue > 0 ? `Margin ${(grossProfit / totalRevenue * 100).toFixed(1)}%` : "—"}
          color={grossProfit >= 0 ? "from-emerald-500 to-green-600" : "from-red-500 to-red-600"} icon="💰" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniCard label="สินค้าในระบบ" value={k.productCount.toLocaleString()} sub={`${k.lowStock} สต็อคต่ำ`} />
        <MiniCard label="ลูกค้า" value={k.customerCount.toLocaleString()} />
        <MiniCard label="สินค้ารับเข้า" value={`${k.inventoryIn} ชิ้น`} color="text-blue-600" />
        <MiniCard label="สินค้าจ่ายออก" value={`${k.inventoryOut} ชิ้น`} color="text-orange-600" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">รายรับรายวัน</h2>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded" /> Invoice</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" /> POS</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-48 overflow-x-auto">
          {chartData.map((d: any, i: number) => {
            const invH = (d.invoice / maxAgg) * 140;
            const posH = (d.pos / maxAgg) * 140;
            return (
              <div key={i} className="flex-1 min-w-[20px] flex flex-col items-center gap-1" title={`${d.label}: Invoice ฿${Math.round(d.invoice).toLocaleString()} + POS ฿${Math.round(d.pos).toLocaleString()}`}>
                <div className="w-full flex flex-col items-center">
                  <div className="w-full max-w-[30px] bg-blue-500 rounded-t" style={{ height: `${Math.max(0, invH)}px` }} />
                  <div className="w-full max-w-[30px] bg-green-500" style={{ height: `${Math.max(0, posH)}px` }} />
                </div>
                {chartData.length <= 31 && <span className="text-[9px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">{d.label}</span>}
              </div>
            );
          })}
          {chartData.length === 0 && <p className="flex-1 text-center text-gray-400 py-16">ไม่มีข้อมูล</p>}
        </div>
      </div>

      {/* Top Products + Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สินค้าขายดี (Top 10)</h2>
          <div className="space-y-3">
            {data.topProducts.map((p: any, i: number) => {
              const maxR = Math.max(...data.topProducts.map((x: any) => x.revenue), 1);
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(p.revenue / maxR) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">฿{Math.round(p.revenue).toLocaleString()}</span>
                </div>
              );
            })}
            {data.topProducts.length === 0 && <p className="text-gray-400 text-center py-4">ไม่มีข้อมูลในช่วงนี้</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ลูกค้า Top 10</h2>
          <div className="space-y-3">
            {data.topCustomers.map((c: any, i: number) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i < 3 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.count} เอกสาร</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">฿{Math.round(c.revenue).toLocaleString()}</span>
              </div>
            ))}
            {data.topCustomers.length === 0 && <p className="text-gray-400 text-center py-4">ไม่มีข้อมูลในช่วงนี้</p>}
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">มูลค่าสต็อค</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">มูลค่าทุน</p>
              <p className="text-xl font-bold text-gray-900">฿{Math.round(k.stockCost).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">มูลค่าขาย</p>
              <p className="text-xl font-bold text-blue-600">฿{Math.round(k.stockSell).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">สรุปรายรับ-รายจ่าย</h2>
          <div className="space-y-2 mt-4 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">รายรับรวม</span><span className="font-bold text-green-600">+฿{Math.round(totalRevenue).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ซื้อสินค้า</span><span className="font-bold text-red-500">-฿{Math.round(k.purchaseTotal).toLocaleString()}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold text-gray-700">กำไรขั้นต้น</span><span className={`font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>฿{Math.round(grossProfit).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg">
      <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <span className="text-2xl">{icon}</span>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
        <p className="text-xs text-white/70 mt-1">{sub}</p>
      </div>
    </div>
  );
}

function MiniCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function aggregateByWeek(days: any[]) {
  const weeks: any[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    weeks.push({
      label: chunk[0].day.slice(5),
      invoice: chunk.reduce((s: number, d: any) => s + d.invoice, 0),
      pos: chunk.reduce((s: number, d: any) => s + d.pos, 0),
    });
  }
  return weeks;
}

function aggregateByMonth(days: any[]) {
  const map: Record<string, { invoice: number; pos: number }> = {};
  for (const d of days) {
    const m = d.day.slice(0, 7);
    if (!map[m]) map[m] = { invoice: 0, pos: 0 };
    map[m].invoice += d.invoice;
    map[m].pos += d.pos;
  }
  return Object.entries(map).map(([m, v]) => ({ label: m.slice(5), ...v }));
}
