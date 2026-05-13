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
          product: { include: { images: { where: { isPrimary: true }, take: 1 }, inventory: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!catalog) notFound();
  const company = await prisma.companyInfo.findFirst();

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

      <div id="print-area">
        {/* ═══════ COVER PAGE ═══════ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 print:break-after-page print:rounded-none print:border-0 print:shadow-none print:mb-0">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white" style={{ minHeight: "297mm" }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-64 h-64 border-4 border-white rounded-full" />
              <div className="absolute bottom-20 left-10 w-48 h-48 border-4 border-white rounded-full" />
              <div className="absolute top-1/3 left-1/4 w-32 h-32 border-2 border-white rounded-full" />
            </div>

            <div className="relative p-16 flex flex-col items-center justify-center text-center" style={{ minHeight: "297mm" }}>
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt="Logo" className="w-28 h-28 rounded-2xl object-contain bg-white p-2 mb-8 shadow-lg" />
              ) : (
                <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                  <span className="text-blue-600 font-bold text-5xl">{company?.name?.[0] || "B"}</span>
                </div>
              )}

              <h1 className="text-4xl font-bold mb-2">{company?.name || "ชื่อธุรกิจของคุณ"}</h1>
              <p className="text-xl text-blue-200 mb-10">{company?.nameEn || ""}</p>

              <div className="w-24 h-1 bg-white/50 rounded-full mb-10" />

              <h2 className="text-3xl font-bold mb-3">{catalog.coverTitle || catalog.name}</h2>
              {(catalog.coverSubtitle || catalog.description) && (
                <p className="text-xl text-blue-200 max-w-lg">{catalog.coverSubtitle || catalog.description}</p>
              )}

              {catalog.customer && (
                <div className="mt-10 bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4">
                  <p className="text-sm text-blue-200">จัดทำสำหรับ</p>
                  <p className="text-lg font-bold">{catalog.customer.name}</p>
                </div>
              )}

              <div className="absolute bottom-16 left-0 right-0 text-center">
                <div className="inline-flex items-center gap-6 text-sm text-blue-200">
                  <span>{catalog.items.length} รายการ</span>
                  <span>
                    {catalog.validUntil
                      ? `ราคาใช้ได้ถึง ${catalog.validUntil.toLocaleDateString("th-TH")}`
                      : "ราคาใช้ได้ไม่เกิน 1 เดือนหลังจากวันที่สร้าง"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-blue-300 space-y-0.5">
                  <p>{company?.address1} {company?.subdistrict} {company?.district} {company?.province}</p>
                  <p>โทร. {company?.phone} {company?.email ? `| ${company.email}` : ""} {company?.lineId ? `| LINE: ${company.lineId}` : ""}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ INTRO PAGE ═══════ */}
        {catalog.introText && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 mb-8 print:break-after-page print:rounded-none print:border-0 print:shadow-none print:mb-0" style={{ minHeight: "200mm" }}>
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mb-8" />
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {catalog.customer ? `เรียน ${catalog.customer.name}` : "เรียน ลูกค้าผู้มีอุปการคุณ"}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{catalog.introText}</p>
              <div className="w-16 h-1 bg-blue-600 rounded-full mx-auto mt-8" />
            </div>
          </div>
        )}

        {/* ═══════ PRODUCT GRID ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4 mb-8">
          {catalog.items.map((item, idx) => {
            const price = item.customPrice ? Number(item.customPrice) : Number(item.product.sellingPrice);
            const originalPrice = Number(item.product.sellingPrice);
            const totalStock = item.product.inventory.reduce((s, i) => s + i.quantity, 0);
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden print:break-inside-avoid">
                <div className="h-48 bg-gray-100 flex items-center justify-center print:h-36 relative">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0].imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                  ) : (
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {item.isFeatured && (
                    <span className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full bg-yellow-400 text-yellow-900 font-bold shadow">แนะนำ</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.product.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{item.product.productCode} | {item.product.unit}</p>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      {item.customPrice && Number(item.customPrice) < originalPrice && (
                        <p className="text-xs text-gray-400 line-through">฿{originalPrice.toLocaleString()}</p>
                      )}
                      <p className="text-xl font-bold text-blue-600">฿{price.toLocaleString()}</p>
                    </div>
                    <span className={`text-xs ${totalStock > 0 ? "text-green-600" : "text-red-500"}`}>
                      {totalStock > 0 ? "มีสินค้า" : "สินค้าหมด"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════ BACK PAGE - Contact & CTA ═══════ */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden print:break-before-page print:rounded-none print:border-0">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-16 text-center" style={{ minHeight: "297mm" }}>
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center" style={{ minHeight: "250mm" }}>
              {/* Closing text */}
              {catalog.closingText && (
                <div className="mb-12">
                  <div className="w-16 h-1 bg-blue-500 rounded-full mx-auto mb-8" />
                  <p className="text-xl text-gray-300 leading-relaxed">{catalog.closingText}</p>
                </div>
              )}

              {/* Company info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 w-full max-w-lg">
                {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-contain bg-white p-1 mx-auto mb-4" />
                ) : (
                  <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-3xl">{company?.name?.[0] || "B"}</span>
                  </div>
                )}
                <h3 className="text-2xl font-bold">{company?.name || "ชื่อธุรกิจของคุณ"}</h3>
                {company?.nameEn && <p className="text-gray-400 mt-1">{company.nameEn}</p>}

                <div className="mt-6 space-y-3 text-gray-300">
                  {company?.address1 && <p>{company.address1}</p>}
                  <p>{company?.subdistrict} {company?.district} {company?.province} {company?.postalCode}</p>
                  {company?.phone && (
                    <p className="text-lg font-bold text-white">
                      <span className="text-gray-400 text-sm font-normal">โทร. </span>{company.phone}
                    </p>
                  )}
                  {company?.email && <p>Email: {company.email}</p>}
                  {company?.lineId && <p>LINE: {company.lineId}</p>}
                  {company?.website && <p>{company.website}</p>}
                  {company?.taxId && <p className="text-sm text-gray-400">Tax ID: {company.taxId}</p>}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12">
                <p className="text-2xl font-bold text-white mb-2">พร้อมให้บริการ</p>
                <p className="text-gray-400">ติดต่อเราเพื่อสั่งซื้อหรือสอบถามข้อมูลเพิ่มเติม</p>
              </div>

              {/* Valid until */}
              <div className="mt-8 text-sm text-gray-500">
                {catalog.validUntil ? (
                  <p>ราคานี้ใช้ได้ถึง {catalog.validUntil.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</p>
                ) : (
                  <p>ราคาใช้ได้ไม่เกิน 1 เดือนหลังจากวันที่สร้าง</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  วันที่สร้าง: {catalog.createdAt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
