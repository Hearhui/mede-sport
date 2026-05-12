import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CatalogPage() {
  const catalogs = await prisma.catalog.findMany({
    include: {
      _count: { select: { items: true } },
      items: { take: 4, include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แคตตาล็อค</h1>
          <p className="text-gray-500 mt-1">สร้างแคตตาล็อคสินค้าเพื่อเสนอราคาหรือแสดงสินค้าร้าน</p>
        </div>
        <Link href="/catalog/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + สร้างแคตตาล็อคใหม่
        </Link>
      </div>

      {catalogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-500 text-lg">ยังไม่มีแคตตาล็อค</p>
          <Link href="/catalog/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">สร้างแคตตาล็อคแรก →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogs.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog/${cat.id}`}
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Preview thumbnails */}
              <div className="grid grid-cols-4 gap-0.5 bg-gray-100 h-32">
                {cat.items.map((item) => (
                  <div key={item.id} className="bg-gray-200 flex items-center justify-center">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0].imageUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 4 - cat.items.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-200" />
                ))}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${cat.catalogType === 'SHOP' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {cat.catalogType === 'SHOP' ? 'แคตตาล็อคร้าน' : 'เสนอราคา'}
                  </span>
                </div>
                {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{cat._count.items} สินค้า</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
