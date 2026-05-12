import { prisma } from "@/lib/prisma";
import Link from "next/link";

const typeLabels: Record<string, string> = {
  QUOTATION: "ใบเสนอราคา",
  PURCHASE_ORDER: "ใบสั่งซื้อ",
  INVOICE: "ใบกำกับภาษี",
  RECEIPT: "ใบเสร็จรับเงิน",
  DELIVERY_NOTE: "ใบส่งของ",
  CREDIT_NOTE: "ใบลดหนี้",
  DEBIT_NOTE: "ใบเพิ่มหนี้",
};

const typeColors: Record<string, string> = {
  QUOTATION: "bg-blue-100 text-blue-700",
  PURCHASE_ORDER: "bg-indigo-100 text-indigo-700",
  INVOICE: "bg-green-100 text-green-700",
  RECEIPT: "bg-emerald-100 text-emerald-700",
  DELIVERY_NOTE: "bg-yellow-100 text-yellow-700",
  CREDIT_NOTE: "bg-red-100 text-red-700",
  DEBIT_NOTE: "bg-orange-100 text-orange-700",
};

const statusLabels: Record<string, string> = {
  DRAFT: "แบบร่าง",
  SENT: "ส่งแล้ว",
  APPROVED: "อนุมัติ",
  PAID: "ชำระแล้ว",
  CANCELLED: "ยกเลิก",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  PAID: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const type = params.type || "";
  const page = parseInt(params.page || "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { documentNo: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (type) where.documentType = type;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        customer: true,
        _count: { select: { items: true } },
        parentDocument: { select: { documentNo: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const docTypes = Object.entries(typeLabels);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เอกสาร</h1>
          <p className="text-gray-500 mt-1">{total.toLocaleString()} รายการ</p>
        </div>
        <Link
          href="/documents/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + สร้างใบเสนอราคา
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <form className="flex-1">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="ค้นหาเลขที่เอกสาร หรือชื่อลูกค้า..."
            className="w-full md:max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {type && <input type="hidden" name="type" value={type} />}
        </form>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/documents"
            className={`px-3 py-2 rounded-lg text-xs font-medium ${!type ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            ทั้งหมด
          </Link>
          {docTypes.map(([key, label]) => (
            <Link
              key={key}
              href={`/documents?type=${key}`}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${type === key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">เลขที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">อ้างอิง</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">สถานะ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">รายการ</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">ยอดรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/documents/${doc.id}`} className="text-blue-600 hover:underline font-medium">
                    {doc.documentNo}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${typeColors[doc.documentType]}`}>
                    {typeLabels[doc.documentType]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{doc.customer.name}</td>
                <td className="px-4 py-3 text-gray-500">{doc.date.toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{doc.parentDocument?.documentNo || "-"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[doc.status]}`}>
                    {statusLabels[doc.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{doc._count.items}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  ฿{Number(doc.total).toLocaleString()}
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
              href={`/documents?search=${search}&type=${type}&page=${p}`}
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
