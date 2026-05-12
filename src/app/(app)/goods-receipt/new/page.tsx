import { prisma } from "@/lib/prisma";
import GoodsReceiptForm from "./GoodsReceiptForm";

export default async function NewGoodsReceiptPage() {
  const [suppliers, locations] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, supplierCode: true, name: true } }),
    prisma.location.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">รับเข้าสินค้าใหม่</h1>
      <GoodsReceiptForm suppliers={suppliers} locations={locations} />
    </div>
  );
}
