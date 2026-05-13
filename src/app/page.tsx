import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-xl">มีดี สปอร์ต</h1>
              <p className="text-xs text-gray-500">MEDE SPORT SYSTEM</p>
            </div>
          </div>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 font-medium shadow-sm transition">
            เข้าสู่ระบบ
          </Link>
        </nav>

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-extrabold text-gray-900 leading-tight">
            ระบบจัดการ<span className="text-blue-600">ธุรกิจ</span>
            <br />อุปกรณ์กีฬาครบวงจร
          </h2>
          <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto">
            จัดการสินค้า คลังสินค้า ออกใบเสนอราคา ใบกำกับภาษี POS ขายหน้าร้าน
            รายงานกำไร-ขาดทุน และ VAT ในระบบเดียว
          </p>
          <div className="flex gap-4 justify-center mt-10">
            <Link href="/login" className="bg-blue-600 text-white px-8 py-3.5 rounded-xl hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="bg-white text-gray-700 px-8 py-3.5 rounded-xl hover:bg-gray-50 font-bold text-lg border border-gray-300 shadow-sm transition-all">
              สมัครใช้งาน
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {[
            { icon: "📦", title: "สินค้า 1,000+", desc: "จัดการสินค้า ราคาทุน ราคาขาย สต็อค Import/Export Excel" },
            { icon: "📄", title: "ออกเอกสาร", desc: "ใบเสนอราคา ใบกำกับภาษี ใบส่งของ ใบลดหนี้ พิมพ์ PDF" },
            { icon: "🏪", title: "POS หน้าร้าน", desc: "ขายสินค้าหน้าร้าน พิมพ์สลิป/บิล A4 รองรับเงินสดและโอน" },
            { icon: "📊", title: "รายงานครบ", desc: "P&L กำไรขาดทุน VAT สินค้าขายดี สินค้าค้างสต็อค" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mt-3">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Section - Dark Card */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-gray-900 rounded-3xl p-10 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <p className="text-blue-400 text-sm font-semibold tracking-wider uppercase mb-2">Developed by</p>
              <h3 className="text-3xl font-extrabold text-white">Chatree Thiraworakul</h3>
              <p className="text-xl text-blue-300 font-bold mt-1">Chujai AI</p>
              <p className="text-gray-400 mt-4 text-lg">
                Available for consultation & custom development
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <a href="tel:063-989-7935"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 font-medium transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  063-989-7935
                </a>
                <a href="https://line.me/ti/p/~hearhui" target="_blank"
                  className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl hover:bg-green-600 font-medium transition">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINE: hearhui
                </a>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                รับงาน Consult & พัฒนาระบบ
              </div>
              <p className="text-gray-500 mt-3 text-sm">
                ระบบจัดการธุรกิจ, ERP, AI Integration
                <br />ปรึกษาฟรี ไม่มีค่าใช้จ่าย
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        <p>&copy; 2026 มีดี สปอร์ต จำกัด — Powered by Chujai AI</p>
      </footer>
    </div>
  );
}
