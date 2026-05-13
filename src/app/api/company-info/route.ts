import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const company = await prisma.companyInfo.findFirst();
  return NextResponse.json(company);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const existing = await prisma.companyInfo.findFirst();

  const data = {
    name: body.name,
    nameEn: body.nameEn || null,
    businessType: body.businessType || null,
    businessDesc: body.businessDesc || null,
    website: body.website || null,
    lineId: body.lineId || null,
    email: body.email || null,
    address1: body.address1 || null,
    address2: body.address2 || null,
    subdistrict: body.subdistrict || null,
    district: body.district || null,
    province: body.province || null,
    country: body.country || "ประเทศไทย",
    postalCode: body.postalCode || null,
    taxId: body.taxId || null,
    phone: body.phone || null,
    fax: body.fax || null,
    logoUrl: body.logoUrl || null,
    vatEnabled: body.vatEnabled ?? true,
    vatRate: body.vatRate || 7,
    docPrefixQuote: body.docPrefixQuote || "QT",
    docPrefixInvoice: body.docPrefixInvoice || "INV",
    docPrefixReceipt: body.docPrefixReceipt || "RC",
    docPrefixDelivery: body.docPrefixDelivery || "DN",
    docPrefixPo: body.docPrefixPo || "PO",
    docFooterText: body.docFooterText || null,
    docSignerLeft: body.docSignerLeft || null,
    docSignerCenter: body.docSignerCenter || null,
    docSignerRight: body.docSignerRight || null,
    docNoteDefault: body.docNoteDefault || null,
    docBankInfo: body.docBankInfo || null,
    docConditions: body.docConditions || null,
  };

  let company;
  if (existing) {
    company = await prisma.companyInfo.update({ where: { id: existing.id }, data });
  } else {
    company = await prisma.companyInfo.create({ data });
  }

  return NextResponse.json(company);
}
