import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import ProductImageManager from "./ProductImageManager";
import ProductAttachments from "./ProductAttachments";
import CostEditor from "./CostEditor";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
      inventory: { include: { location: true }, orderBy: { quantity: "desc" } },
      category: true,
      receiptItems: {
        include: { goodsReceipt: { select: { grnNumber: true, date: true, supplier: { select: { name: true } } } } },
        orderBy: { goodsReceipt: { date: "desc" } },
        take: 5,
      },
    },
  });
  if (!product) notFound();

  const company = await prisma.companyInfo.findFirst({ select: { costMethod: true } });
  const costMethod = company?.costMethod || "JIT";

  const totalStock = product.inventory.reduce((s, i) => s + i.quantity, 0);
  const stockValue = totalStock * Number(product.costPrice);
  const margin = Number(product.sellingPrice) > 0
    ? ((Number(product.sellingPrice) - Number(product.costPrice)) / Number(product.sellingPrice) * 100).toFixed(1)
    : "0";

  // Recent movements
  const movements = await prisma.inventoryMovement.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { location: true },
  });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/products" className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              {!product.isActive && <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">ปิดการใช้งาน</span>}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{product.productCode} | {product.brand || "-"} | {product.unit}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">แก้ไข</Link>
          <DeleteButton apiUrl={`/api/products/${product.id}`} itemName={product.name} redirectUrl="/products" size="md" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Image */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            {product.images.length > 0 ? (
              <img src={product.images[0].imageUrl} alt={product.name} className="w-full aspect-square object-cover rounded-xl" />
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400 mt-2">ไม่มีรูปภาพ</p>
                </div>
              </div>
            )}
            <ProductImageManager productId={product.id} images={product.images} />
          </div>
        </div>

        {/* Info */}
        <div className="col-span-2 space-y-4">
          {/* Cost Editor — JIT / AVG / Custom + History */}
          <CostEditor
            productId={product.id}
            costPrice={Number(product.costPrice)}
            lastCostPrice={Number(product.lastCostPrice)}
            avgCostPrice={Number(product.avgCostPrice)}
            sellingPrice={Number(product.sellingPrice)}
            description={product.description || ""}
            costMethod={costMethod}
            receiptItems={product.receiptItems.map((ri) => ({
              id: ri.id,
              unitCost: Number(ri.unitCost),
              quantityReceived: ri.quantityReceived,
              goodsReceipt: {
                grnNumber: ri.goodsReceipt.grnNumber,
                date: ri.goodsReceipt.date.toISOString(),
                supplier: ri.goodsReceipt.supplier,
              },
            }))}
          />

          {/* Stock Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">สต็อคตาม Location</h3>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{totalStock} {product.unit}</span>
                <p className="text-xs text-gray-400">มูลค่า ฿{Math.round(stockValue).toLocaleString()}</p>
              </div>
            </div>
            {product.inventory.length > 0 ? (
              <div className="space-y-2">
                {product.inventory.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-mono text-gray-700">{inv.location.code}</span>
                    <span className={`text-sm font-bold ${inv.quantity <= 2 ? 'text-red-600' : inv.quantity <= 10 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {inv.quantity} {product.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">ไม่มีสต็อค</p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">รายละเอียดสินค้า</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Extended Details */}
          {(() => {
            const details = [
              { label: "SKU", value: product.sku },
              { label: "Barcode", value: product.barcode },
              { label: "สี", value: product.color },
              { label: "ขนาด", value: product.size },
              { label: "น้ำหนัก", value: product.weight },
              { label: "วัสดุ", value: product.material },
              { label: "แหล่งผลิต", value: product.origin },
              { label: "การรับประกัน", value: product.warranty },
              { label: "สั่งขั้นต่ำ", value: product.minOrder ? `${product.minOrder} ${product.unit}` : null },
            ].filter((d) => d.value);

            return details.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">ข้อมูลจำเพาะ</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {details.map((d) => (
                    <div key={d.label} className="flex gap-2">
                      <dt className="text-gray-500 shrink-0 w-24">{d.label}</dt>
                      <dd className="text-gray-900 font-medium">{d.value}</dd>
                    </div>
                  ))}
                </dl>
                {product.specifications && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Specifications</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.specifications}</p>
                  </div>
                )}
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">เอกสารแนบ</h3>
        <ProductAttachments productId={product.id} attachments={product.attachments} />
      </div>

      {/* Movement History */}
      {movements.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">ประวัติการเคลื่อนไหว (ล่าสุด 10 รายการ)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-500">วันที่</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">ประเภท</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">คลัง</th>
                <th className="text-right px-4 py-2 font-medium text-gray-500">จำนวน</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2 text-gray-500">{m.createdAt.toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.movementType === "IN" ? "bg-green-100 text-green-700" :
                      m.movementType === "OUT" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {m.movementType === "IN" ? "รับเข้า" : m.movementType === "OUT" ? "ขายออก" : m.movementType}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{m.location.code}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    <span className={m.movementType === "IN" ? "text-green-600" : "text-red-600"}>
                      {m.movementType === "IN" ? "+" : "-"}{m.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">{m.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
