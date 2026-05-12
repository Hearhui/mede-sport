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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/catalog" className="text-sm text-blue-600 hover:underline mb-2 inline-block">← กลับแคตตาล็อค</Link>
          <h1 className="text-2xl font-bold text-gray-900">{catalog.name}</h1>
          <p className="text-gray-500 mt-1">{catalog.description}</p>
        </div>
        <button onClick={() => window.print()}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium print:hidden">
          พิมพ์แคตตาล็อค
        </button>
      </div>

      {/* Catalog Grid */}
      <div id="print-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalog.items.map((item) => {
          const price = item.customPrice ? Number(item.customPrice) : Number(item.product.sellingPrice);
          const totalStock = item.product.inventory.reduce((s, i) => s + i.quantity, 0);
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden print:break-inside-avoid">
              {/* Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0].imageUrl} className="w-full h-full object-cover" alt={item.product.name} />
                ) : (
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-400 mt-1">ไม่มีรูป</p>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">{item.product.name}</h3>
                  {item.isFeatured && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 ml-2 shrink-0">แนะนำ</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{item.product.productCode} | {item.product.unit}</p>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    {item.customPrice && Number(item.customPrice) < Number(item.product.sellingPrice) && (
                      <p className="text-xs text-gray-400 line-through">฿{Number(item.product.sellingPrice).toLocaleString()}</p>
                    )}
                    <p className="text-lg font-bold text-blue-600">฿{price.toLocaleString()}</p>
                  </div>
                  <span className={`text-xs ${totalStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {totalStock > 0 ? `มีสินค้า (${totalStock})` : 'สินค้าหมด'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
