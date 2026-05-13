import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

export default async function PosReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tx = await prisma.posTransaction.findUnique({
    where: { id: parseInt(id) },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!tx) notFound();

  const company = await prisma.companyInfo.findFirst();

  return (
    <>
      {/* Print button */}
      <div className="max-w-[80mm] mx-auto mb-4 print:hidden">
        <PrintButton />
      </div>

      {/* Receipt - 80mm thermal receipt style */}
      <div className="max-w-[80mm] mx-auto bg-white p-4 text-xs font-mono print:p-2 print:shadow-none shadow-lg" style={{ minHeight: "auto" }}>
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <p className="text-sm font-bold">{company?.name || "บริษัท มีดี สปอร์ต จำกัด"}</p>
          <p className="text-[10px] text-gray-600">{company?.nameEn || "MEDE SPORT CO.,LTD"}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {company?.address1 || "339/303 ซอยเพชรเกษม 69 แยก 5"}
          </p>
          <p className="text-[10px] text-gray-500">
            {company?.subdistrict || "แขวงหลักสอง"} {company?.district || "เขตบางแค"} {company?.province || "กรุงเทพฯ"} {company?.postalCode || "10160"}
          </p>
          <p className="text-[10px] text-gray-500">โทร. {company?.phone || "087-0356821"}</p>
          <p className="text-[10px] text-gray-500">Tax ID: {company?.taxId || "0105563110337"}</p>
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <p className="text-sm font-bold">ใบเสร็จรับเงิน / CASH RECEIPT</p>
        </div>

        {/* Info */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5">
          <div className="flex justify-between">
            <span className="text-gray-500">เลขที่:</span>
            <span className="font-bold">{tx.transactionNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">วันที่:</span>
            <span>{tx.createdAt.toLocaleString("th-TH")}</span>
          </div>
          {(tx.customer || tx.customerName || tx.customerCompany) && (
            <div className="border-t border-dashed border-gray-300 pt-1 mt-1 space-y-0.5">
              {(tx.customerCompany || tx.customer?.name) && (
                <div>
                  <span className="text-gray-500">ลูกค้า: </span>
                  <span className="font-bold">{tx.customerCompany || tx.customer?.name}</span>
                </div>
              )}
              {tx.customerName && (
                <div>
                  <span className="text-gray-500">ชื่อ: </span>
                  <span>{tx.customerName}</span>
                </div>
              )}
              {tx.customerAddress && (
                <div>
                  <span className="text-gray-500">ที่อยู่: </span>
                  <span>{tx.customerAddress}</span>
                </div>
              )}
              {(tx.customerTaxId || tx.customer?.taxId) && (
                <div>
                  <span className="text-gray-500">Tax ID: </span>
                  <span>{tx.customerTaxId || tx.customer?.taxId}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">ชำระ:</span>
            <span>{tx.paymentMethod === "CASH" ? "เงินสด" : "โอนเงิน"}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
          {tx.items.map((item, i) => (
            <div key={item.id} className="mb-1.5">
              <p className="truncate">{i + 1}. {item.description}</p>
              <div className="flex justify-between pl-3">
                <span className="text-gray-500">{item.quantity} x ฿{Number(item.unitPrice).toLocaleString()}</span>
                <span className="font-bold">฿{Number(item.amount).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>รวม ({tx.items.length} รายการ)</span>
            <span>฿{Number(tx.subtotal).toLocaleString()}</span>
          </div>
          {Number(tx.discount) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>ส่วนลด</span>
              <span>-฿{Number(tx.discount).toLocaleString()}</span>
            </div>
          )}
          {Number(tx.vatAmount) > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>VAT 7%</span>
              <span>฿{Number(tx.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1">
            <span>ยอดสุทธิ</span>
            <span>฿{Number(tx.total).toLocaleString()}</span>
          </div>
          {tx.paymentMethod === "CASH" && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">รับเงิน</span>
                <span>฿{Number(tx.cashReceived).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>เงินทอน</span>
                <span>฿{Number(tx.changeAmount).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center border-t border-dashed border-gray-400 pt-3">
          <p className="text-gray-500">ขอบคุณที่ใช้บริการ</p>
          <p className="text-gray-400 text-[10px] mt-1">Thank you for your purchase</p>
          <p className="text-gray-400 text-[10px] mt-2">*** มีดี สปอร์ต ***</p>
        </div>
      </div>
    </>
  );
}
