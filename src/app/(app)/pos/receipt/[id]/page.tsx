import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";

function numberToThaiText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);
  function convertGroup(n: number): string {
    if (n === 0) return "";
    const str = String(n);
    let result = "";
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(str[i]);
      const pos = len - i - 1;
      if (d === 0) continue;
      if (pos === 1 && d === 1) { result += "สิบ"; continue; }
      if (pos === 1 && d === 2) { result += "ยี่สิบ"; continue; }
      if (pos === 0 && d === 1 && len > 1) { result += "เอ็ด"; continue; }
      result += digits[d] + positions[pos];
    }
    return result;
  }
  let result = "";
  if (intPart >= 1000000) {
    result += convertGroup(Math.floor(intPart / 1000000)) + "ล้าน";
    result += convertGroup(intPart % 1000000);
  } else {
    result += convertGroup(intPart);
  }
  result += "บาท";
  if (decPart > 0) { result += convertGroup(decPart) + "สตางค์"; } else { result += "ถ้วน"; }
  return result;
}

export default async function PosReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { id } = await params;
  const { format } = await searchParams;
  const isA4 = format === "a4";

  const tx = await prisma.posTransaction.findUnique({
    where: { id: parseInt(id) },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!tx) notFound();

  const company = await prisma.companyInfo.findFirst();

  return (
    <>
      {/* Format selector + Print */}
      <div className={`${isA4 ? "max-w-[210mm]" : "max-w-[80mm]"} mx-auto mb-4 print:hidden flex gap-2`}>
        <Link
          href={`/pos/receipt/${id}`}
          className={`flex-1 py-2 text-center rounded-lg text-sm font-medium border ${!isA4 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
        >
          สลิป 80mm
        </Link>
        <Link
          href={`/pos/receipt/${id}?format=a4`}
          className={`flex-1 py-2 text-center rounded-lg text-sm font-medium border ${isA4 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"}`}
        >
          บิลเงินสด A4
        </Link>
        <PrintButton />
      </div>

      {isA4 ? (
        /* ===== A4 Cash Bill ===== */
        <div className="max-w-[210mm] mx-auto bg-white print:shadow-none shadow-lg">
          <div className="p-8 print:p-6 text-sm" style={{ minHeight: "297mm" }}>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{company?.name || "ชื่อธุรกิจของคุณ"}</h1>
                    <p className="text-xs text-gray-500">{company?.nameEn || "YOUR BUSINESS"}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>{company?.address1 || "ที่อยู่ธุรกิจ"}</p>
                  <p>{company?.subdistrict || "แขวงหลักสอง"} {company?.district || "เขตบางแค"} {company?.province || "กรุงเทพมหานคร"} {company?.postalCode || "10160"}</p>
                  <p>โทร. {company?.phone || "เบอร์โทร"}</p>
                  <p>เลขประจำตัวผู้เสียภาษี {company?.taxId || "เลขผู้เสียภาษี"}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-blue-600">ใบเสร็จรับเงิน</h2>
                <p className="text-xs text-gray-500">CASH RECEIPT</p>
              </div>
            </div>

            {/* Customer + Info */}
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">ลูกค้า / Customer</p>
                {(tx.customerCompany || tx.customer?.name) && (
                  <p className="font-bold text-gray-900">{tx.customerCompany || tx.customer?.name}</p>
                )}
                {tx.customerName && <p className="text-xs text-gray-600">{tx.customerName}</p>}
                {tx.customerAddress && <p className="text-xs text-gray-600 mt-1">{tx.customerAddress}</p>}
                {(tx.customerTaxId || tx.customer?.taxId) && (
                  <p className="text-xs text-gray-600 mt-1">เลขผู้เสียภาษี {tx.customerTaxId || tx.customer?.taxId}</p>
                )}
                {!tx.customerCompany && !tx.customer?.name && !tx.customerName && (
                  <p className="text-gray-400">ลูกค้าทั่วไป</p>
                )}
              </div>
              <div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-500 w-36">เลขที่ / No.</td>
                      <td className="py-1.5 font-bold">{tx.transactionNo}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-500">วันที่ / Date</td>
                      <td className="py-1.5">{tx.createdAt.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-gray-500">ชำระโดย</td>
                      <td className="py-1.5">{tx.paymentMethod === "CASH" ? "เงินสด" : "โอนเงิน"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm border border-gray-300 mb-6">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="py-2 px-3 text-center w-12 border-r border-blue-500">ลำดับ</th>
                  <th className="py-2 px-3 text-left border-r border-blue-500">รายการ / Description</th>
                  <th className="py-2 px-3 text-right w-24 border-r border-blue-500">ราคา/หน่วย</th>
                  <th className="py-2 px-3 text-center w-16 border-r border-blue-500">จำนวน</th>
                  <th className="py-2 px-3 text-right w-28">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody>
                {tx.items.map((item, i) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2 px-3 text-center text-gray-500 border-r border-gray-200">{i + 1}</td>
                    <td className="py-2 px-3 border-r border-gray-200">{item.description}</td>
                    <td className="py-2 px-3 text-right border-r border-gray-200">{Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3 text-center border-r border-gray-200">{item.quantity}</td>
                    <td className="py-2 px-3 text-right font-medium">{Number(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {Array.from({ length: Math.max(0, 8 - tx.items.length) }).map((_, i) => (
                  <tr key={`e-${i}`} className="border-b border-gray-200">
                    <td className="py-2 px-3 border-r border-gray-200">&nbsp;</td>
                    <td className="py-2 px-3 border-r border-gray-200"></td>
                    <td className="py-2 px-3 border-r border-gray-200"></td>
                    <td className="py-2 px-3 border-r border-gray-200"></td>
                    <td className="py-2 px-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Thai text + Totals */}
            <div className="flex gap-6">
              <div className="flex-1 border border-gray-300 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">จำนวนเงิน (ตัวอักษร)</p>
                <p className="font-bold text-gray-900">{numberToThaiText(Number(tx.total))}</p>
              </div>
              <div className="w-72">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-1.5 text-gray-600">รวมเงิน / Subtotal</td>
                      <td className="py-1.5 text-right font-medium">{Number(tx.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {Number(tx.discount) > 0 && (
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 text-red-500">ส่วนลด</td>
                        <td className="py-1.5 text-right text-red-500">-{Number(tx.discount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    {Number(tx.vatAmount) > 0 && (
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 text-gray-600">VAT 7% (รวมแล้ว)</td>
                        <td className="py-1.5 text-right text-gray-500">{Number(tx.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    <tr className="bg-blue-600 text-white">
                      <td className="py-2 px-2 font-bold">ยอดสุทธิ / Total</td>
                      <td className="py-2 px-2 text-right font-bold text-lg">{Number(tx.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {tx.paymentMethod === "CASH" && (
                      <>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 text-gray-500">รับเงิน</td>
                          <td className="py-1.5 text-right">{Number(tx.cashReceived).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 font-bold">เงินทอน</td>
                          <td className="py-1.5 text-right font-bold">{Number(tx.changeAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank info */}
            {company?.docBankInfo && (
              <div className="mt-4 text-xs text-gray-600 border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-1">ข้อมูลการชำระเงิน</p>
                <p className="whitespace-pre-line">{company.docBankInfo}</p>
              </div>
            )}

            {/* Signature */}
            <div className="grid grid-cols-2 gap-16 mt-12">
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-xs text-gray-600">{company?.docSignerLeft || "ผู้ออกเอกสาร / Authorized"}</p>
                <p className="text-xs text-gray-500 mt-1">{company?.name || "ชื่อธุรกิจของคุณ"}</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-xs text-gray-600">{company?.docSignerRight || "ผู้รับสินค้า / Received by"}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ===== Slip 80mm ===== */
        <div className="max-w-[80mm] mx-auto bg-white p-4 text-xs font-mono print:p-2 print:shadow-none shadow-lg" style={{ minHeight: "auto" }}>
          <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
            <p className="text-sm font-bold">{company?.name || "ชื่อธุรกิจของคุณ"}</p>
            <p className="text-[10px] text-gray-600">{company?.nameEn || "YOUR BUSINESS"}</p>
            <p className="text-[10px] text-gray-500 mt-1">{company?.address1 || "ที่อยู่ธุรกิจ"}</p>
            <p className="text-[10px] text-gray-500">{company?.subdistrict || "แขวงหลักสอง"} {company?.district || "เขตบางแค"} {company?.province || "กรุงเทพฯ"} {company?.postalCode || "10160"}</p>
            <p className="text-[10px] text-gray-500">โทร. {company?.phone || "เบอร์โทร"}</p>
            <p className="text-[10px] text-gray-500">Tax ID: {company?.taxId || "เลขผู้เสียภาษี"}</p>
          </div>
          <div className="text-center mb-3">
            <p className="text-sm font-bold">ใบเสร็จรับเงิน / CASH RECEIPT</p>
          </div>
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2 space-y-0.5">
            <div className="flex justify-between"><span className="text-gray-500">เลขที่:</span><span className="font-bold">{tx.transactionNo}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">วันที่:</span><span>{tx.createdAt.toLocaleString("th-TH")}</span></div>
            {(tx.customer || tx.customerName || tx.customerCompany) && (
              <div className="border-t border-dashed border-gray-300 pt-1 mt-1 space-y-0.5">
                {(tx.customerCompany || tx.customer?.name) && <div><span className="text-gray-500">ลูกค้า: </span><span className="font-bold">{tx.customerCompany || tx.customer?.name}</span></div>}
                {tx.customerName && <div><span className="text-gray-500">ชื่อ: </span><span>{tx.customerName}</span></div>}
                {tx.customerAddress && <div><span className="text-gray-500">ที่อยู่: </span><span>{tx.customerAddress}</span></div>}
                {(tx.customerTaxId || tx.customer?.taxId) && <div><span className="text-gray-500">Tax ID: </span><span>{tx.customerTaxId || tx.customer?.taxId}</span></div>}
              </div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">ชำระ:</span><span>{tx.paymentMethod === "CASH" ? "เงินสด" : "โอนเงิน"}</span></div>
          </div>
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
          <div className="space-y-1 mb-3">
            <div className="flex justify-between"><span>รวม ({tx.items.length} รายการ)</span><span>฿{Number(tx.subtotal).toLocaleString()}</span></div>
            {Number(tx.discount) > 0 && <div className="flex justify-between text-red-500"><span>ส่วนลด</span><span>-฿{Number(tx.discount).toLocaleString()}</span></div>}
            {Number(tx.vatAmount) > 0 && <div className="flex justify-between text-gray-500"><span>VAT 7%</span><span>฿{Number(tx.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>}
            <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1"><span>ยอดสุทธิ</span><span>฿{Number(tx.total).toLocaleString()}</span></div>
            {tx.paymentMethod === "CASH" && (
              <>
                <div className="flex justify-between"><span className="text-gray-500">รับเงิน</span><span>฿{Number(tx.cashReceived).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold"><span>เงินทอน</span><span>฿{Number(tx.changeAmount).toLocaleString()}</span></div>
              </>
            )}
          </div>
          <div className="text-center border-t border-dashed border-gray-400 pt-3">
            <p className="text-gray-500">ขอบคุณที่ใช้บริการ</p>
            <p className="text-gray-400 text-[10px] mt-1">Thank you for your purchase</p>
            <p className="text-gray-400 text-[10px] mt-2">*** ขอบคุณที่ใช้บริการ ***</p>
          </div>
        </div>
      )}
    </>
  );
}
