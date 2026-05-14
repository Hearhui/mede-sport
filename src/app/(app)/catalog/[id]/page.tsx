import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await prisma.catalog.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 3 },
              inventory: true,
              category: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!catalog) notFound();
  const company = await prisma.companyInfo.findFirst();

  // Company info helper
  const co = {
    name: company?.name || "ชื่อธุรกิจ",
    nameEn: company?.nameEn || "",
    logo: company?.logoUrl,
    phone: company?.phone,
    email: company?.email,
    line: company?.lineId,
    web: company?.website,
    address: [company?.address1, company?.subdistrict, company?.district, company?.province, company?.postalCode].filter(Boolean).join(" "),
    taxId: company?.taxId,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <Link href="/catalog" className="text-sm text-blue-600 hover:underline mb-2 inline-block">← กลับแคตตาล็อค</Link>
          <h1 className="text-2xl font-bold text-gray-900">{catalog.name}</h1>
          {catalog.customer && <p className="text-gray-500">สำหรับ: {catalog.customer.name}</p>}
        </div>
        <PrintButton />
      </div>

      <div id="print-area" className="max-w-[210mm] mx-auto">

        {/* ═══════ COVER PAGE ═══════ */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white relative overflow-hidden print:break-after-page" style={{ minHeight: "297mm" }}>
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          </div>

          <div className="relative flex flex-col items-center justify-center text-center px-12 py-16" style={{ minHeight: "297mm" }}>
            {co.logo ? (
              <img src={co.logo} alt="Logo" className="w-32 h-32 rounded-3xl object-contain bg-white p-3 mb-8 shadow-2xl" />
            ) : (
              <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
                <span className="text-blue-700 font-black text-6xl">{co.name[0]}</span>
              </div>
            )}

            <h1 className="text-4xl font-black tracking-tight">{co.name}</h1>
            {co.nameEn && <p className="text-xl text-blue-200 mt-2 font-medium">{co.nameEn}</p>}

            <div className="w-20 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full my-10" />

            <h2 className="text-3xl font-bold">{catalog.coverTitle || catalog.name}</h2>
            {(catalog.coverSubtitle || catalog.description) && (
              <p className="text-xl text-blue-200 mt-3 max-w-md">{catalog.coverSubtitle || catalog.description}</p>
            )}

            {catalog.customer && (
              <div className="mt-10 bg-white/15 backdrop-blur-sm rounded-2xl px-10 py-5 border border-white/20">
                <p className="text-sm text-blue-200">จัดทำสำหรับ</p>
                <p className="text-2xl font-bold mt-1">{catalog.customer.name}</p>
              </div>
            )}

            <div className="absolute bottom-12 left-0 right-0 px-12">
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                {co.phone && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {co.phone}
                  </span>
                )}
                {co.line && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-full">LINE: {co.line}</span>
                )}
                {co.email && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-full">{co.email}</span>
                )}
                {co.web && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-full">{co.web}</span>
                )}
              </div>
              <p className="text-xs text-blue-300 mt-3">{co.address}</p>
              <p className="text-xs text-blue-400 mt-1">{catalog.items.length} รายการ | {catalog.validUntil ? `ราคาใช้ได้ถึง ${catalog.validUntil.toLocaleDateString("th-TH")}` : "ราคา ณ วันที่ออกเอกสาร"}</p>
            </div>
          </div>
        </div>

        {/* ═══════ INTRO PAGE ═══════ */}
        {catalog.introText && (
          <div className="bg-white print:break-after-page px-12 py-20" style={{ minHeight: "200mm" }}>
            <div className="max-w-xl mx-auto text-center">
              <div className="w-16 h-1.5 bg-blue-600 rounded-full mx-auto mb-10" />
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                {catalog.customer ? `เรียน ${catalog.customer.name}` : "เรียน ลูกค้าผู้มีอุปการคุณ"}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{catalog.introText}</p>
              <div className="w-16 h-1.5 bg-blue-600 rounded-full mx-auto mt-10" />
              <p className="text-sm text-gray-400 mt-6">{co.name}</p>
            </div>
          </div>
        )}

        {/* ═══════ PRODUCT PAGES ═══════ */}
        {catalog.items.map((item, idx) => {
          const price = item.customPrice ? Number(item.customPrice) : Number(item.product.sellingPrice);
          const originalPrice = Number(item.product.sellingPrice);
          const totalStock = item.product.inventory.reduce((s, i) => s + i.quantity, 0);
          const hasDiscount = item.customPrice && Number(item.customPrice) < originalPrice;
          const primaryImage = item.product.images?.[0]?.imageUrl;
          const details = [
            { label: "รหัสสินค้า", value: item.product.productCode },
            { label: "แบรนด์", value: item.product.brand },
            { label: "หน่วย", value: item.product.unit },
            { label: "หมวดหมู่", value: item.product.category?.name },
            { label: "สี", value: item.product.color },
            { label: "ขนาด", value: item.product.size },
            { label: "วัสดุ", value: item.product.material },
            { label: "น้ำหนัก", value: item.product.weight },
            { label: "แหล่งผลิต", value: item.product.origin },
            { label: "การรับประกัน", value: item.product.warranty },
          ].filter(d => d.value);

          // 2 products per page in print
          const shouldBreak = idx > 0 && idx % 2 === 0;

          return (
            <div key={item.id} className={`bg-white ${shouldBreak ? "print:break-before-page" : ""}`}>
              <div className="border-b border-gray-100 print:break-inside-avoid">
                <div className="flex flex-col md:flex-row">
                  {/* Product Image — Large */}
                  <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-6 print:p-4 relative">
                    {primaryImage ? (
                      <img src={primaryImage} alt={item.product.name}
                        className="w-full max-h-[350px] print:max-h-[250px] object-contain rounded-xl" />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center">
                        <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {item.isFeatured && (
                      <span className="absolute top-4 right-4 text-xs px-3 py-1.5 rounded-full bg-yellow-400 text-yellow-900 font-bold shadow-lg">แนะนำ</span>
                    )}
                    <span className="absolute top-4 left-4 text-xs px-2 py-1 rounded-lg bg-black/50 text-white font-mono">#{idx + 1}</span>
                  </div>

                  {/* Product Info */}
                  <div className="md:w-1/2 p-6 print:p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 leading-tight">{item.product.name}</h3>
                      <p className="text-sm text-gray-400 mt-1 font-mono">{item.product.productCode}</p>

                      {/* Price */}
                      <div className="mt-4 bg-blue-50 rounded-xl p-4 print:p-3">
                        {hasDiscount && (
                          <p className="text-sm text-gray-400 line-through">฿{originalPrice.toLocaleString()}</p>
                        )}
                        <p className="text-3xl font-black text-blue-600">฿{price.toLocaleString()}<span className="text-sm font-normal text-gray-400 ml-1">/{item.product.unit}</span></p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${totalStock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {totalStock > 0 ? "พร้อมส่ง" : "สั่งจอง"}
                          </span>
                          {item.product.minOrder && (
                            <span className="text-xs text-gray-400">สั่งขั้นต่ำ {item.product.minOrder} {item.product.unit}</span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {item.product.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 leading-relaxed">{item.product.description}</p>
                        </div>
                      )}

                      {/* Specs */}
                      {item.product.specifications && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">คุณสมบัติ</p>
                          <p className="text-xs text-gray-500 whitespace-pre-line">{item.product.specifications}</p>
                        </div>
                      )}

                      {/* Detail chips */}
                      {details.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {details.map(d => (
                            <span key={d.label} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                              {d.label}: <span className="font-medium text-gray-800">{d.value}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Company mini footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                      {co.logo ? (
                        <img src={co.logo} className="w-5 h-5 rounded object-contain" alt="" />
                      ) : (
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">{co.name[0]}</span>
                        </div>
                      )}
                      <span>{co.name}</span>
                      {co.phone && <span>| {co.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* ═══════ BACK PAGE ═══════ */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white print:break-before-page" style={{ minHeight: "297mm" }}>
          <div className="flex flex-col items-center justify-center text-center px-12 py-20" style={{ minHeight: "297mm" }}>
            {catalog.closingText && (
              <div className="max-w-lg mb-16">
                <div className="w-16 h-1.5 bg-blue-500 rounded-full mx-auto mb-8" />
                <p className="text-xl text-gray-300 leading-relaxed whitespace-pre-line">{catalog.closingText}</p>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 w-full max-w-md border border-white/10">
              {co.logo ? (
                <img src={co.logo} alt="Logo" className="w-24 h-24 rounded-2xl object-contain bg-white p-2 mx-auto mb-6 shadow-xl" />
              ) : (
                <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <span className="text-white font-black text-4xl">{co.name[0]}</span>
                </div>
              )}
              <h3 className="text-2xl font-bold">{co.name}</h3>
              {co.nameEn && <p className="text-gray-400 mt-1">{co.nameEn}</p>}

              <div className="mt-8 space-y-3 text-gray-300">
                {co.phone && <p className="text-2xl font-bold text-white">{co.phone}</p>}
                <div className="flex flex-wrap justify-center gap-3 text-sm">
                  {co.line && <span className="bg-green-600/30 px-4 py-1.5 rounded-full">LINE: {co.line}</span>}
                  {co.email && <span className="bg-blue-600/30 px-4 py-1.5 rounded-full">{co.email}</span>}
                  {co.web && <span className="bg-purple-600/30 px-4 py-1.5 rounded-full">{co.web}</span>}
                </div>
                <p className="text-sm">{co.address}</p>
                {co.taxId && <p className="text-xs text-gray-500">เลขประจำตัวผู้เสียภาษี {co.taxId}</p>}
              </div>
            </div>

            <div className="mt-12">
              <p className="text-3xl font-black text-white mb-2">พร้อมให้บริการ</p>
              <p className="text-gray-400">ติดต่อเราเพื่อสั่งซื้อหรือสอบถามข้อมูลเพิ่มเติม</p>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>{catalog.validUntil ? `ราคานี้ใช้ได้ถึง ${catalog.validUntil.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}` : "ราคา ณ วันที่ออกเอกสาร"}</p>
              <p className="text-xs text-gray-600 mt-1">สร้างเมื่อ {catalog.createdAt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
