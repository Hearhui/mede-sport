import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintActions from "./PrintActions";

const typeLabels: Record<string, { th: string; en: string }> = {
  QUOTATION: { th: "ใบเสนอราคา", en: "QUOTATION" },
  PURCHASE_ORDER: { th: "ใบสั่งซื้อ", en: "PURCHASE ORDER" },
  INVOICE: { th: "ใบกำกับภาษี / ใบส่งสินค้า / ใบเสร็จรับเงิน", en: "TAX INVOICE / DELIVERY ORDER / RECEIPT" },
  RECEIPT: { th: "ใบเสร็จรับเงิน", en: "RECEIPT" },
  DELIVERY_NOTE: { th: "ใบส่งสินค้า", en: "DELIVERY NOTE" },
  CREDIT_NOTE: { th: "ใบลดหนี้", en: "CREDIT NOTE" },
  DEBIT_NOTE: { th: "ใบเพิ่มหนี้", en: "DEBIT NOTE" },
};

const vatLabels: Record<string, string> = {
  IN_VAT: "รวม VAT แล้ว",
  EX_VAT: "ยังไม่รวม VAT",
  NO_VAT: "ไม่มี VAT",
};

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

  if (decPart > 0) {
    result += convertGroup(decPart) + "สตางค์";
  } else {
    result += "ถ้วน";
  }

  return result;
}

export default async function PrintDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: true,
      parentDocument: { select: { documentNo: true, documentType: true } },
      items: {
        orderBy: { itemNo: "asc" },
        include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      },
    },
  });

  if (!doc) notFound();

  const company = await prisma.companyInfo.findFirst();
  const typeInfo = typeLabels[doc.documentType] || { th: doc.documentType, en: "" };

  return (
    <>
      <PrintActions documentId={doc.id} />

      <div id="print-area" className="max-w-[210mm] mx-auto bg-white print:shadow-none shadow-lg">
        {/* Page */}
        <div className="p-8 print:p-6 text-sm" style={{ minHeight: "297mm" }}>

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {company?.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain" />
                ) : (
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{company?.name?.[0] || "B"}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {company?.name || "ชื่อธุรกิจของคุณ"}
                  </h1>
                  <p className="text-xs text-gray-500">{company?.nameEn || ""}</p>
                </div>
              </div>
              <div className="text-xs text-gray-600 ml-15 space-y-0.5">
                {company?.address1 && <p>{company.address1}</p>}
                <p>{[company?.subdistrict, company?.district, company?.province, company?.postalCode].filter(Boolean).join(" ")}</p>
                {company?.phone && <p>โทร. {company.phone}</p>}
                {company?.taxId && <p>เลขประจำตัวผู้เสียภาษี {company.taxId}</p>}
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-xl font-bold text-blue-600">{typeInfo.th}</h2>
              <p className="text-xs text-gray-500">{typeInfo.en}</p>
              {doc.documentType === "INVOICE" && (
                <>
                  <p className="text-xs text-gray-500 mt-1">ต้นฉบับ / ORIGINAL</p>
                  <p className="text-xs text-gray-400">(เอกสารออกเป็นชุด)</p>
                </>
              )}
            </div>
          </div>

          {/* Customer + Document Info */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Customer */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">ชื่อและที่อยู่ลูกค้า / Customer Name and Address</p>
              <p className="font-bold text-gray-900">{doc.customer.name}</p>
              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                {doc.customer.addressLine1 && <p>{doc.customer.addressLine1} {doc.customer.addressLine2 || ""}</p>}
                <p>{[doc.customer.subdistrict, doc.customer.district].filter(Boolean).join(" ")}</p>
                <p>{doc.customer.province} {doc.customer.postalCode}</p>
                {doc.customer.taxId && <p>เลขประจำตัวผู้เสียภาษี {doc.customer.taxId}</p>}
                {doc.customer.phone && <p>โทร. {doc.customer.phone}</p>}
              </div>
            </div>

            {/* Document Details */}
            <div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-500 w-40">เลขที่ / No.</td>
                    <td className="py-1.5 font-bold text-gray-900">{doc.documentNo}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-500">วันที่ / Date</td>
                    <td className="py-1.5">{doc.date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</td>
                  </tr>
                  {doc.validUntil && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-500">ใช้ได้ถึง / Expire Date</td>
                      <td className="py-1.5">{doc.validUntil.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}</td>
                    </tr>
                  )}
                  {doc.dueDate && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-500">ครบกำหนด / Due Date</td>
                      <td className="py-1.5">{doc.dueDate.toLocaleDateString("th-TH")}</td>
                    </tr>
                  )}
                  {doc.referenceNo && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-500 font-medium">
                        {doc.documentType === "RECEIPT" ? "อ้างอิงใบกำกับภาษีเลขที่" :
                         doc.documentType === "CREDIT_NOTE" ? "อ้างอิงใบกำกับภาษีเลขที่" :
                         "เลขที่อ้างอิง / Ref. No."}
                      </td>
                      <td className="py-1.5 font-bold text-blue-700">{doc.referenceNo}</td>
                    </tr>
                  )}
                  {doc.parentDocument && !doc.referenceNo && (
                    <tr className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-500 font-medium">
                        อ้างอิง {typeLabels[doc.parentDocument.documentType]?.th || "เอกสาร"}
                      </td>
                      <td className="py-1.5 font-bold text-blue-700">{doc.parentDocument.documentNo}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1.5 text-gray-500">เงื่อนไขชำระเงิน</td>
                    <td className="py-1.5">{doc.paymentTerm || "Cash"}</td>
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
              {doc.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 text-center text-gray-500 border-r border-gray-200">{item.itemNo}</td>
                  <td className="py-2 px-3 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      {doc.showImages && item.product?.images?.[0] && (
                        <img src={item.product.images[0].imageUrl} className="w-8 h-8 rounded object-cover" alt="" />
                      )}
                      <span>{item.description}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right border-r border-gray-200">{Number(item.unitPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 px-3 text-center border-r border-gray-200">{Number(item.quantity)}</td>
                  <td className="py-2 px-3 text-right font-medium">{Number(item.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {/* Empty rows to fill space */}
              {Array.from({ length: Math.max(0, 8 - doc.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-gray-200">
                  <td className="py-2 px-3 border-r border-gray-200">&nbsp;</td>
                  <td className="py-2 px-3 border-r border-gray-200"></td>
                  <td className="py-2 px-3 border-r border-gray-200"></td>
                  <td className="py-2 px-3 border-r border-gray-200"></td>
                  <td className="py-2 px-3"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals + Thai Text */}
          <div className="flex gap-6">
            {/* Thai amount text */}
            <div className="flex-1 border border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">จำนวนเงิน (ตัวอักษร)</p>
              <p className="font-bold text-gray-900">{numberToThaiText(Number(doc.total))}</p>
            </div>

            {/* Totals */}
            <div className="w-72">
              <table className="w-full text-sm">
                <tbody>
                  {doc.vatType === "EX_VAT" ? (
                    <>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 text-gray-600">รวมเงิน / Subtotal</td>
                        <td className="py-1.5 text-right font-medium">{Number(doc.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 text-gray-600">ภาษีมูลค่าเพิ่ม {Number(doc.vatRate)}%</td>
                        <td className="py-1.5 text-right font-medium">{Number(doc.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  ) : doc.vatType === "IN_VAT" ? (
                    <>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 text-gray-600">รวมเงิน / Subtotal</td>
                        <td className="py-1.5 text-right font-medium">{Number(doc.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 text-gray-600">VAT {Number(doc.vatRate)}% (รวมแล้ว)</td>
                        <td className="py-1.5 text-right text-gray-500">{Number(doc.vatAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  ) : (
                    <tr className="border-b border-gray-200">
                      <td className="py-1.5 text-gray-600">รวมเงิน / Subtotal</td>
                      <td className="py-1.5 text-right font-medium">{Number(doc.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  <tr className="bg-blue-600 text-white">
                    <td className="py-2 px-2 font-bold">ยอดรวมสุทธิ / Grand Total</td>
                    <td className="py-2 px-2 text-right font-bold text-lg">{Number(doc.total).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Info */}
          {company?.docBankInfo && (
            <div className="mt-4 text-xs text-gray-600 border border-gray-200 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">ข้อมูลการชำระเงิน / Payment Information</p>
              <p className="whitespace-pre-line">{company.docBankInfo}</p>
            </div>
          )}

          {/* Notes */}
          {(doc.notes || company?.docNoteDefault) && (
            <div className="mt-4 text-xs text-gray-600">
              <p className="font-medium">หมายเหตุ: {doc.notes || company?.docNoteDefault}</p>
            </div>
          )}

          {/* Footer Text */}
          {company?.docFooterText && (
            <div className="mt-2 text-xs text-gray-500">
              <p>{company.docFooterText}</p>
            </div>
          )}

          {/* Signature - 3 columns */}
          <div className="grid grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-12"></div>
              <p className="text-xs text-gray-600">{company?.docSignerLeft || "ผู้ออกเอกสาร / Authorized"}</p>
              <p className="text-xs text-gray-500 mt-1">{company?.name || "บริษัท มีดี สปอร์ต จำกัด"}</p>
              <p className="text-xs text-gray-400">วันที่ ....../....../......</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-12"></div>
              <p className="text-xs text-gray-600">{company?.docSignerCenter || "ผู้อนุมัติ / Approved"}</p>
              <p className="text-xs text-gray-500 mt-1">{company?.name || "บริษัท มีดี สปอร์ต จำกัด"}</p>
              <p className="text-xs text-gray-400">วันที่ ....../....../......</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-12"></div>
              <p className="text-xs text-gray-600">{company?.docSignerRight || "ผู้รับสินค้า / Received by"}</p>
              <p className="text-xs text-gray-500 mt-1">{doc.customer.name}</p>
              <p className="text-xs text-gray-400">วันที่ ....../....../......</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
