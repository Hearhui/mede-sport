import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="font-bold text-gray-900">มีดี <span className="text-blue-600">สปอร์ต</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2">เข้าสู่ระบบ</Link>
            <Link href="/register" className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition">เริ่มใช้ฟรี</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-blue-100">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            ระบบจัดการธุรกิจ All-in-One
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
            จัดการธุรกิจให้
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ง่าย ครบ จบ</span>
            <br />ในที่เดียว
          </h1>

          <p className="text-xl text-gray-500 mt-8 max-w-2xl mx-auto leading-relaxed">
            สินค้า คลังสินค้า เอกสาร POS รายงาน — ทุกอย่างที่ธุรกิจต้องการ
            <br className="hidden md:block" />ใช้ได้กับทุกประเภทธุรกิจ ตั้งค่าครั้งเดียว ใช้ได้เลย
          </p>

          <div className="flex gap-4 justify-center mt-10">
            <Link href="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
              เริ่มใช้งานฟรี →
            </Link>
            <Link href="/login" className="bg-white text-gray-700 px-8 py-4 rounded-xl font-bold text-lg border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              เข้าสู่ระบบ
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-16">
            {[
              { num: "16+", label: "โมดูล" },
              { num: "100%", label: "ฟรี" },
              { num: "24/7", label: "ใช้งานได้" },
              { num: "30 วิ", label: "ตั้งค่า" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold text-gray-900">{s.num}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">ครบทุกฟีเจอร์ที่ธุรกิจต้องการ</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "📦", title: "จัดการสินค้า & บริการ", desc: "สินค้า + บริการ ราคาทุน/ขาย กำไร สต็อค รูปภาพ เอกสารแนบ Import/Export Excel" },
              { icon: "📄", title: "ออกเอกสารครบ 7 ประเภท", desc: "ใบเสนอราคา ใบกำกับภาษี ใบส่งของ ใบเสร็จ ใบลดหนี้ ใบเพิ่มหนี้ ใบสั่งซื้อ พิมพ์ A4 หลายหน้า แปลงเอกสารต่อเนื่อง" },
              { icon: "🏪", title: "POS ขายหน้าร้าน", desc: "ค้นหาสินค้า ขายเร็ว พิมพ์สลิป 80mm หรือ A4 รองรับเงินสด/โอน ใส่ข้อมูลลูกค้า ออกใบกำกับภาษีได้" },
              { icon: "💰", title: "ต้นทุน JIT & เฉลี่ย", desc: "ระบบต้นทุนล่าสุด (JIT) + ต้นทุนเฉลี่ยถ่วงน้ำหนัก (AVG) เลือกวิธีได้ วิเคราะห์ต้นทุน Margin สินค้า" },
              { icon: "🏭", title: "คลังสินค้า Multi-Location", desc: "สต็อคหลาย Location รับสินค้าเข้า (GRN) ปรับสต็อค นับสต็อค Import/Export Excel เคลื่อนไหวสต็อค" },
              { icon: "📊", title: "Dashboard & รายงาน 6 แบบ", desc: "กำไร-ขาดทุน กระแสเงินสด VAT สินค้าขายดี สินค้าค้างสต็อค เคลื่อนไหวสต็อค เลือกช่วงเวลาได้" },
              { icon: "👥", title: "ลูกค้า & ซัพพลายเออร์", desc: "จัดการข้อมูลลูกค้า ซัพพลายเออร์ ที่อยู่ เลขภาษี เครดิต Import/Export Excel" },
              { icon: "📑", title: "ใบวางบิล & รายจ่าย", desc: "ใบวางบิล (Billing Notes) บันทึกรายจ่าย หมวดหมู่รายจ่าย ติดตามต้นทุนการดำเนินงาน" },
              { icon: "📋", title: "แคตตาล็อกมืออาชีพ", desc: "เลือกสินค้า checkbox หน้าปก+หน้าหลัง marketing พิมพ์ PDF ส่งลูกค้า" },
              { icon: "📤", title: "แพ็คสินค้า & จัดส่ง", desc: "สร้าง Packing List จากเอกสาร ติดตามการจัดส่ง บันทึกน้ำหนัก ขนาดพัสดุ" },
              { icon: "⚙️", title: "ตั้งค่าระบบครบ", desc: "ข้อมูลธุรกิจ โลโก้ VAT เลขเอกสาร ลายเซ็น ธนาคาร เงื่อนไข วิธีคิดต้นทุน Backup ปิดปี" },
              { icon: "📱", title: "ใช้ได้ทุกอุปกรณ์", desc: "Responsive Design รองรับ PC Tablet มือถือ เข้าใช้งานผ่าน Browser ได้ทันที ไม่ต้องติดตั้ง" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <span className="text-4xl">{f.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-4">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini Programs */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Mini Programs</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">เข้าถึงทุกโมดูลได้ทันที</h2>
            <p className="text-gray-500 mt-3">คลิกเพื่อเข้าใช้งานแต่ละโมดูลโดยตรง</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {[
              { icon: "🏠", label: "แดชบอร์ด", href: "/dashboard", color: "from-blue-500 to-blue-600" },
              { icon: "📦", label: "สินค้า", href: "/products", color: "from-orange-500 to-orange-600" },
              { icon: "🏪", label: "POS ขาย", href: "/pos", color: "from-green-500 to-green-600" },
              { icon: "📄", label: "เอกสาร", href: "/documents/new", color: "from-indigo-500 to-indigo-600" },
              { icon: "👥", label: "ลูกค้า", href: "/customers", color: "from-purple-500 to-purple-600" },
              { icon: "🚚", label: "ซัพพลายเออร์", href: "/suppliers", color: "from-teal-500 to-teal-600" },
              { icon: "📊", label: "รายงาน", href: "/reports", color: "from-pink-500 to-pink-600" },
              { icon: "🏭", label: "คลังสินค้า", href: "/inventory", color: "from-amber-500 to-amber-600" },
              { icon: "📋", label: "แคตตาล็อก", href: "/catalog", color: "from-cyan-500 to-cyan-600" },
              { icon: "📥", label: "รับสินค้า", href: "/goods-receipt", color: "from-lime-600 to-lime-700" },
              { icon: "📑", label: "ใบวางบิล", href: "/billing-notes", color: "from-rose-500 to-rose-600" },
              { icon: "📤", label: "แพ็คสินค้า", href: "/packing", color: "from-violet-500 to-violet-600" },
              { icon: "💰", label: "รายจ่าย", href: "/expenses", color: "from-red-500 to-red-600" },
              { icon: "📈", label: "วิเคราะห์ต้นทุน", href: "/cost-analysis", color: "from-emerald-500 to-emerald-600" },
              { icon: "🔢", label: "นับสต็อค", href: "/stock-count", color: "from-sky-500 to-sky-600" },
              { icon: "⚙️", label: "ตั้งค่า", href: "/settings", color: "from-gray-600 to-gray-700" },
              { icon: "👤", label: "ผู้ใช้งาน", href: "/users", color: "from-slate-500 to-slate-600" },
              { icon: "📖", label: "คู่มือ", href: "#guide", color: "from-yellow-500 to-yellow-600" },
            ].map((app) => (
              <Link key={app.label} href={app.href}
                className="group flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-gray-50 transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all text-2xl`}>
                  {app.icon}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">{app.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">Use Cases</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-12">ใช้ได้กับทุกธุรกิจ</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "ร้านขายปลีก", "ร้านขายส่ง", "ร้านอาหาร", "คลินิก", "ร้านซ่อม",
              "ฟรีแลนซ์", "ร้านออนไลน์", "โรงงาน", "บริการ IT", "ร้านเสริมสวย",
              "อุปกรณ์กีฬา", "วัสดุก่อสร้าง", "ร้านกาแฟ", "ร้านเสื้อผ้า", "อะไหล่รถ",
            ].map((u) => (
              <span key={u} className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition cursor-default">{u}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold">เริ่มใช้งานง่ายๆ 3 ขั้นตอน</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "สมัคร & ตั้งค่า", desc: "สมัครสมาชิก ใส่ข้อมูลธุรกิจ โลโก้ อัตรา VAT เลขเอกสาร เสร็จใน 30 วินาที" },
              { step: "02", title: "เพิ่มข้อมูล", desc: "เพิ่มสินค้า/ลูกค้า ด้วยมือ หรือ Import Excel ทีเดียวได้เป็นพันรายการ" },
              { step: "03", title: "เริ่มใช้งาน", desc: "ออกใบเสนอราคา ขายหน้าร้าน ดูรายงาน — ทุกอย่างพร้อมใช้ทันที" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-extrabold text-blue-400">{s.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-12 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1">
                <p className="text-blue-400 text-sm font-semibold tracking-wider uppercase mb-3">Developed by</p>
                <h3 className="text-3xl font-extrabold text-white">Chatree Thiraworakul</h3>
                <p className="text-xl text-blue-300 font-bold mt-1">Chujai AI</p>
                <p className="text-gray-400 mt-4 text-lg leading-relaxed">
                  รับพัฒนาระบบจัดการธุรกิจ ERP CRM
                  <br />AI Integration & Custom Solutions
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  <a href="tel:063-989-7935"
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium transition shadow-lg shadow-blue-500/25">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    063-989-7935
                  </a>
                  <a href="https://line.me/ti/p/~hearhui" target="_blank"
                    className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 font-medium transition shadow-lg shadow-green-500/25">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                    LINE: hearhui
                  </a>
                </div>
              </div>
              <div className="text-center lg:text-right shrink-0">
                <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-5 py-2.5 rounded-full text-sm font-medium mb-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  พร้อมรับงาน
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">
                  ระบบจัดการธุรกิจ, ERP
                  <br />AI Integration
                  <br />ปรึกษาฟรี ไม่มีค่าใช้จ่าย
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Guide */}
      <section id="guide" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">User Guide</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">คู่มือการใช้งานระบบ</h2>
            <p className="text-gray-500 mt-3">เรียนรู้การใช้งานแต่ละโมดูลอย่างละเอียด</p>
          </div>

          <div className="space-y-4">
            {[
              {
                module: "1. เริ่มต้นใช้งาน (Getting Started)",
                steps: [
                  "สมัครสมาชิกที่หน้า Register กรอก ชื่อ อีเมล รหัสผ่าน",
                  "เข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่สมัครไว้",
                  "ไปที่ ตั้งค่า > ข้อมูลธุรกิจ กรอกชื่อบริษัท ที่อยู่ เลขภาษี โทรศัพท์",
                  "อัปโหลดโลโก้ (แนะนำ PNG 200x200px) ตั้งค่า VAT และ Prefix เลขเอกสาร",
                ],
              },
              {
                module: "2. จัดการสินค้า (Products)",
                steps: [
                  "เพิ่มสินค้าทีละรายการ: กรอก ชื่อ SKU ราคาทุน ราคาขาย หน่วย หมวดหมู่",
                  "Import Excel: ดาวน์โหลด Template > กรอกข้อมูล > อัปโหลดไฟล์ (รองรับ .xlsx)",
                  "เพิ่มรูปสินค้า: คลิกที่สินค้า > แท็บรูปภาพ > อัปโหลด (ตั้งรูปหลักได้)",
                  "รองรับทั้งสินค้าและบริการ (เลือก itemType เป็น product หรือ service)",
                ],
              },
              {
                module: "3. ลูกค้า & ซัพพลายเออร์ (Customers & Suppliers)",
                steps: [
                  "เพิ่มลูกค้า/ซัพพลายเออร์: ชื่อ ที่อยู่ เลขภาษี เบอร์โทร อีเมล",
                  "Import/Export Excel ได้ทั้งลูกค้าและซัพพลายเออร์",
                  "ดูประวัติการสั่งซื้อของลูกค้าแต่ละรายได้ที่หน้ารายละเอียด",
                ],
              },
              {
                module: "4. ออกเอกสาร (Documents)",
                steps: [
                  "สร้างเอกสาร: เลือกประเภท (ใบเสนอราคา/ใบกำกับภาษี/ใบส่งของ/ใบเสร็จ/ใบลดหนี้/ใบเพิ่มหนี้)",
                  "เลือกลูกค้า > เพิ่มรายการสินค้า > กำหนดส่วนลด มัดจำ ค่าส่ง VAT",
                  "พิมพ์เอกสาร A4 (รองรับหลายหน้า มีหัว-ท้ายกระดาษทุกหน้า)",
                  "แปลงเอกสารต่อเนื่อง: ใบเสนอราคา → ใบกำกับภาษี → ใบเสร็จ",
                ],
              },
              {
                module: "5. POS ขายหน้าร้าน",
                steps: [
                  "ค้นหาสินค้าด้วยชื่อหรือ SKU > เพิ่มจำนวน > เลือกวิธีชำระ (เงินสด/โอน)",
                  "ใส่ข้อมูลลูกค้า (ถ้ามี) เพื่อออกใบกำกับภาษี",
                  "พิมพ์สลิป (80mm thermal) หรือบิล A4 ได้ทันที",
                  "ดูประวัติการขายทั้งหมดที่ POS > ประวัติ",
                ],
              },
              {
                module: "6. คลังสินค้า (Inventory)",
                steps: [
                  "ดูสต็อคปัจจุบันทุกสินค้า แยกตาม Location",
                  "ปรับสต็อค: เพิ่ม/ลด/ตั้งค่าสต็อค พร้อมระบุเหตุผล",
                  "รับสินค้าเข้า: สร้างใบรับสินค้า (Goods Receipt) เชื่อมกับใบสั่งซื้อ",
                  "นับสต็อค: ใช้เมนู Stock Count เพื่อตรวจนับและปรับยอด",
                  "Import/Export Excel สำหรับปรับสต็อคจำนวนมาก",
                ],
              },
              {
                module: "7. รายงาน (Reports)",
                steps: [
                  "กำไร-ขาดทุน (P&L): เลือกช่วงเวลา ดูรายได้ ต้นทุน กำไร",
                  "กระแสเงินสด (Cashflow): ดูเงินเข้า-ออกรายวัน/เดือน",
                  "VAT Report: สรุปภาษีซื้อ-ภาษีขาย สำหรับยื่น ภ.พ.30",
                  "สินค้าขายดี (Top Products): จัดอันดับสินค้าตามยอดขาย",
                  "สินค้าค้างสต็อค (Dead Stock): สินค้าที่ไม่เคลื่อนไหวนาน",
                  "เคลื่อนไหวสต็อค: ดูประวัติรับ-จ่ายสินค้าแต่ละรายการ",
                ],
              },
              {
                module: "8. แคตตาล็อก (Catalog)",
                steps: [
                  "เลือกสินค้าด้วย checkbox > ใส่ข้อมูลลูกค้า > หน้าปก + หน้าหลัง marketing",
                  "ส่งออกเป็น PDF สำหรับส่งให้ลูกค้า หรือพิมพ์",
                ],
              },
              {
                module: "9. ต้นทุน JIT & เฉลี่ย (Costing)",
                steps: [
                  "ระบบรองรับ 2 วิธีคิดต้นทุน: ต้นทุนล่าสุด (JIT) และ ต้นทุนเฉลี่ยถ่วงน้ำหนัก (Average)",
                  "เลือกวิธีคิดต้นทุนได้ที่ ตั้งค่า > เลขเอกสาร & VAT > วิธีคิดต้นทุน",
                  "เมื่อรับสินค้าเข้า ระบบจะคำนวณทั้ง 2 ต้นทุนให้อัตโนมัติ",
                  "หน้ารายละเอียดสินค้า แสดงทั้ง JIT + AVG พร้อมประวัติต้นทุน 5 ล่าสุด",
                  "วิเคราะห์ต้นทุน: เปรียบเทียบ Margin สินค้าทุกตัว แก้ไขราคาได้ทันที",
                ],
              },
              {
                module: "10. ตั้งค่าระบบ (Settings)",
                steps: [
                  "ข้อมูลธุรกิจ: ชื่อ ที่อยู่ เลขภาษี โลโก้ ประเภทธุรกิจ",
                  "ข้อความเอกสาร: ลายเซ็น (3 ช่อง) ข้อความท้าย หมายเหตุ ธนาคาร เงื่อนไข",
                  "เลขเอกสาร & VAT: Prefix (QT/INV/RC/DN/PO) อัตรา VAT วิธีคิดต้นทุน",
                  "Backup: ดาวน์โหลดข้อมูลทั้งหมดเป็น JSON",
                  "ปิดปี: ลบเอกสาร/POS ปีเก่า เลือกข้อมูลที่จะยกไปปีใหม่",
                  "จัดการข้อมูล: ลบข้อมูลเฉพาะส่วน หรือ Reset ทั้งหมด",
                ],
              },
            ].map((section, idx) => (
              <details key={idx} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gray-50 transition">
                  <h3 className="text-lg font-bold text-gray-900">{section.module}</h3>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 border-t border-gray-100 pt-4">
                  <ol className="space-y-2">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-600">
                        <span className="shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold">พร้อมจัดการธุรกิจแบบมืออาชีพ?</h2>
          <p className="text-xl text-blue-100 mt-4">เริ่มใช้งานได้ทันที ไม่ต้องติดตั้ง ไม่มีค่าใช้จ่าย</p>
          <Link href="/register" className="inline-block mt-8 bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
            เริ่มใช้งานฟรี →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-sm">มีดี สปอร์ต</span>
          </div>
          <p className="text-sm">&copy; 2026 มีดี สปอร์ต — Powered by Chujai AI</p>
        </div>
      </footer>
    </div>
  );
}
