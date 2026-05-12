import { prisma } from "@/lib/prisma";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; location?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const locationFilter = params.location || "";

  const locations = await prisma.location.findMany({ orderBy: { code: "asc" } });

  const where: any = { quantity: { gt: 0 } };
  if (search) {
    where.product = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { productCode: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  if (locationFilter) {
    where.location = { code: locationFilter };
  }

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      location: true,
    },
    orderBy: [{ location: { code: "asc" } }, { product: { name: "asc" } }],
    take: 100,
  });

  const totalValue = inventory.reduce(
    (s, i) => s + i.quantity * Number(i.product.costPrice),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คลังสินค้า</h1>
          <p className="text-gray-500 mt-1">
            มูลค่าสต็อครวม: <span className="font-bold text-gray-900">฿{Math.round(totalValue).toLocaleString()}</span>
          </p>
        </div>
      </div>

      <form className="mb-6 flex gap-4">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="ค้นหาสินค้า..."
          className="flex-1 md:max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          name="location"
          defaultValue={locationFilter}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">ทุกตำแหน่ง</option>
          {locations.map((l) => (
            <option key={l.id} value={l.code}>{l.code} - {l.name}</option>
          ))}
        </select>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สินค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวน</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ทุน/หน่วย</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">มูลค่ารวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventory.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {inv.product.images[0] ? (
                      <img src={inv.product.images[0].imageUrl} className="w-8 h-8 rounded object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{inv.product.name}</p>
                      <p className="text-xs text-gray-400">{inv.product.productCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-mono">
                    {inv.location.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-medium ${inv.quantity <= 2 ? 'text-red-600' : inv.quantity <= 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {inv.quantity} {inv.product.unit}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  ฿{Number(inv.product.costPrice).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  ฿{(inv.quantity * Number(inv.product.costPrice)).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
