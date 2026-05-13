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
    // Document settings
    docFooterText: body.docFooterText || null,
    docSignerLeft: body.docSignerLeft || null,
    docSignerCenter: body.docSignerCenter || null,
    docSignerRight: body.docSignerRight || null,
    docNoteDefault: body.docNoteDefault || null,
    docBankInfo: body.docBankInfo || null,
  };

  let company;
  if (existing) {
    company = await prisma.companyInfo.update({ where: { id: existing.id }, data });
  } else {
    company = await prisma.companyInfo.create({ data });
  }

  return NextResponse.json(company);
}
