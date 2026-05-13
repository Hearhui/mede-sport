import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import ImportExportBar from "@/components/ImportExportBar";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const limit = 25;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { productCode: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        inventory: { include: { location: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สินค้า</h1>
          <p className="text-gray-500 mt-1">{total.toLocaleString()} รายการ</p>
        </div>
        <Link href="/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + เพิ่มสินค้า
        </Link>
      </div>

      {/* Import/Export */}
      <div className="mb-4">
        <ImportExportBar
          exportUrl="/api/products/export"
          templateUrl="/api/products/export?template=1"
          importUrl="/api/products/import"
          entityName="สินค้า"
        />
      </div>

      {/* Search */}
      <form className="mb-6">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="ค้นหาสินค้า... (ชื่อ, รหัส, แบรนด์)"
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อสินค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ราคาขาย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ทุน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">กำไร%</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">สต็อครวม</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => {
              const totalQty = p.inventory.reduce((s, i) => s + i.quantity, 0);
              const margin = Number(p.sellingPrice) > 0
                ? (((Number(p.sellingPrice) - Number(p.costPrice)) / Number(p.sellingPrice)) * 100).toFixed(1)
                : "0";
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.productCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img src={p.images[0].imageUrl} className="w-10 h-10 rounded object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3 text-right font-medium">฿{Number(p.sellingPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-500">฿{Number(p.costPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${parseFloat(margin) >= 20 ? 'bg-green-100 text-green-700' : parseFloat(margin) >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {margin}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${totalQty <= 2 ? 'text-red-600' : totalQty <= 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {totalQty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/products/${p.id}`} className="text-blue-600 hover:underline text-sm">แก้ไข</Link>
                      <DeleteButton apiUrl={`/api/products/${p.id}`} itemName={p.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/products?search=${search}&page=${p}`}
              className={`px-3 py-1 rounded text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
