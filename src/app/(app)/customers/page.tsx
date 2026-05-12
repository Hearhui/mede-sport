import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export default async function CustomersPage({
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
          { customerCode: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>
          <p className="text-gray-500 mt-1">{total.toLocaleString()} ราย</p>
        </div>
        <Link href="/customers/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + เพิ่มลูกค้า
        </Link>
      </div>

      <form className="mb-6">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="ค้นหาลูกค้า... (ชื่อ, รหัส, เบอร์โทร)"
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">รหัส</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ที่อยู่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">โทรศัพท์</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tax ID</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">เอกสาร</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.customerCode}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                  {[c.addressLine1, c.addressLine2, c.subdistrict, c.district, c.province].filter(Boolean).join(" ")}
                </td>
                <td className="px-4 py-3 text-gray-500">{c.phone || "-"}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.taxId || "-"}</td>
                <td className="px-4 py-3 text-right text-gray-500">{c._count.documents}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline text-sm">แก้ไข</Link>
                    <DeleteButton apiUrl={`/api/customers/${c.id}`} itemName={c.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/customers?search=${search}&page=${p}`}
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
