import Link from "next/link";

const reports = [
  { href: "/reports/pl", title: "กำไร-ขาดทุน (P&L)", desc: "รายรับ-รายจ่ายรายเดือน กำไรขั้นต้น เลือกช่วงเวลาได้", icon: "📊", color: "border-blue-200 bg-blue-50" },
  { href: "/reports/vat", title: "สรุป VAT", desc: "VAT ขาย - VAT ซื้อ = VAT ต้องจ่ายรายเดือน", icon: "💰", color: "border-green-200 bg-green-50" },
  { href: "/reports/cashflow", title: "วางแผนทางการเงิน", desc: "เครดิตรับ-จ่าย ประมาณการรายรับรายสัปดาห์ AR/AP", icon: "📅", color: "border-purple-200 bg-purple-50" },
  { href: "/reports/inventory-movement", title: "สินค้ารับเข้า-จ่ายออก", desc: "รายงานการเคลื่อนไหวสินค้าแยกตามช่วงเวลา", icon: "📦", color: "border-orange-200 bg-orange-50" },
  { href: "/reports/top-products", title: "สินค้าขายดี", desc: "Top สินค้าตามช่วงเวลา ทั้ง Invoice และ POS", icon: "🏆", color: "border-yellow-200 bg-yellow-50" },
  { href: "/reports/dead-stock", title: "สินค้าค้าง Stock", desc: "สินค้าไม่เคลื่อนไหว ไม่เคยขาย มูลค่าสต็อคค้าง", icon: "⚠️", color: "border-red-200 bg-red-50" },
  { href: "/cost-analysis", title: "เปรียบเทียบต้นทุน", desc: "ราคาซื้อ vs ขาย Margin กำไรต่อหน่วย", icon: "📈", color: "border-indigo-200 bg-indigo-50" },
];

export default function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">รายงานทั้งหมด</h1>
      <p className="text-gray-500 mb-8">เลือกรายงานที่ต้องการดู ทุกรายงานสามารถเลือกช่วงเวลาและพิมพ์/PDF ได้</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}
            className={`p-6 rounded-2xl border-2 ${r.color} hover:shadow-lg transition-shadow`}>
            <span className="text-3xl">{r.icon}</span>
            <h2 className="text-lg font-bold text-gray-900 mt-3">{r.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
