import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";
  const type = req.nextUrl.searchParams.get("type") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

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
        items: true,
        parentDocument: { select: { documentNo: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ documents, total, page, limit });
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json();

  if (!body.customerId) return NextResponse.json({ error: "กรุณาเลือกลูกค้า" }, { status: 400 });

  // Generate document number
  const prefix = body.documentType === "QUOTATION" ? "QT" :
                 body.documentType === "INVOICE" ? "INV" :
                 body.documentType === "PURCHASE_ORDER" ? "PO" : "DOC";
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const lastDoc = await prisma.document.findFirst({
    where: { documentNo: { startsWith: `${prefix}${yy}${mm}` } },
    orderBy: { documentNo: "desc" },
  });
  const seq = lastDoc
    ? parseInt(lastDoc.documentNo.slice(-3)) + 1
    : 1;
  const documentNo = `${prefix}${yy}${mm}${String(seq).padStart(3, "0")}`;

  // Calculate totals
  const items = body.items || [];
  const subtotal = items.reduce(
    (s: number, i: any) => s + (i.unitPrice || 0) * (i.quantity || 0),
    0
  );
  const vatRate = body.vatRate ?? 7;
  let vatAmount = 0;
  let total = subtotal;

  if (body.vatType === "EX_VAT") {
    vatAmount = subtotal * (vatRate / 100);
    total = subtotal + vatAmount;
  } else if (body.vatType === "IN_VAT") {
    vatAmount = subtotal - subtotal / (1 + vatRate / 100);
    total = subtotal;
  }

  const document = await prisma.document.create({
    data: {
      documentNo,
      documentType: body.documentType || "QUOTATION",
      customerId: body.customerId,
      date: body.date ? new Date(body.date) : new Date(),
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      paymentTerm: body.paymentTerm || "Cash",
      vatType: body.vatType || "IN_VAT",
      vatRate,
      subtotal,
      vatAmount,
      total,
      showImages: body.showImages || false,
      status: body.status || "DRAFT",
      notes: body.notes,
      items: {
        create: items.map((item: any, idx: number) => ({
          itemNo: idx + 1,
          productId: item.productId || null,
          description: item.description,
          unit: item.unit,
          unitPrice: item.unitPrice || 0,
          quantity: item.quantity || 0,
          amount: (item.unitPrice || 0) * (item.quantity || 0),
          imageUrl: item.imageUrl || null,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  return NextResponse.json(document, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
