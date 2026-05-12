import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const catalog = await prisma.catalog.findUnique({
    where: { id: parseInt(id) },
    include: {
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
        </div>
        <button onClick={() => window.print()}
          className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-gray-900 text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          พิมพ์ / PDF
        </button>
      </div>

      <div id="print-area">
        {/* ═══════ COVER PAGE ═══════ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 print:break-after-page print:rounded-none print:border-0 print:shadow-none">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white" style={{ minHeight: "500px" }}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-64 h-64 border-4 border-white rounded-full" />
              <div className="absolute bottom-20 left-10 w-40 h-40 border-4 border-white rounded-full" />
              <div className="absolute top-40 left-1/3 w-20 h-20 border-2 border-white rounded-full" />
            </div>

            <div className="relative p-12 flex flex-col items-center justify-center text-center" style={{ minHeight: "500px" }}>
              {/* Logo */}
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                <span className="text-blue-600 font-bold text-4xl">M</span>
              </div>

              {/* Company name */}
              <h1 className="text-4xl font-bold mb-2">
                {company?.name || "บริษัท มีดี สปอร์ต จำกัด"}
              </h1>
              <p className="text-xl text-blue-200 mb-8">
                {company?.nameEn || "MEDE SPORT CO.,LTD"}
              </p>

              {/* Divider */}
              <div className="w-24 h-1 bg-white/50 rounded-full mb-8" />

              {/* Catalog Title */}
              <h2 className="text-3xl font-bold mb-3">{catalog.name}</h2>
              {catalog.description && (
                <p className="text-lg text-blue-200 max-w-md">{catalog.description}</p>
              )}

              {/* Info */}
              <div className="mt-12 text-sm text-blue-200 space-y-1">
                <p>{company?.address1 || "339/303 ซอยเพชรเกษม 69 แยก 5"}</p>
                <p>{company?.subdistrict || "แขวงหลักสอง"} {company?.district || "เขตบางแค"} {company?.province || "กรุงเทพมหานคร"} {company?.postalCode || "10160"}</p>
                <p>โทร. {company?.phone || "087-0356821"} | Tax ID: {company?.taxId || "0105563110337"}</p>
              </div>

              {/* Item count */}
              <div className="mt-8 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
                <span className="text-sm font-medium">{catalog.items.length} รายการสินค้า</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ PRODUCT GRID ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
          {catalog.items.map((item, idx) => {
            const price = item.customPrice ? Number(item.customPrice) : Number(item.product.sellingPrice);
            const totalStock = item.product.inventory.reduce((s, i) => s + i.quantity, 0);
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden print:break-inside-avoid print:rounded-lg">
                {/* Image */}
                <div className="h-48 bg-gray-100 flex items-center justify-center print:h-36">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images[0].imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                  ) : (
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs text-gray-400">#{idx + 1}</span>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mt-0.5">{item.product.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{item.product.productCode} | {item.product.unit}</p>
                    </div>
                    {item.isFeatured && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">แนะนำ</span>
                    )}
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <div>
                      {item.customPrice && Number(item.customPrice) < Number(item.product.sellingPrice) && (
                        <p className="text-xs text-gray-400 line-through">฿{Number(item.product.sellingPrice).toLocaleString()}</p>
                      )}
                      <p className="text-xl font-bold text-blue-600">฿{price.toLocaleString()}</p>
                    </div>
                    <span className={`text-xs ${totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {totalStock > 0 ? `มีสินค้า` : 'สินค้าหมด'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400 print:mt-4">
          <p>{company?.name || "บริษัท มีดี สปอร์ต จำกัด"} | โทร. {company?.phone || "087-0356821"}</p>
        </div>
      </div>
    </div>
  );
}
