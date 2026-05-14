import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { DocumentType } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const targetType = body.targetType as DocumentType;

  // Get source document
  const source = await prisma.document.findUnique({
    where: { id: parseInt(id) },
    include: { items: true, customer: true },
  });

  if (!source) return NextResponse.json({ error: "Source document not found" }, { status: 404 });

  // Validate conversion path
  const validConversions: Record<string, string[]> = {
    QUOTATION: ["PURCHASE_ORDER", "INVOICE"],
    PURCHASE_ORDER: ["INVOICE", "DELIVERY_NOTE"],
    INVOICE: ["RECEIPT", "CREDIT_NOTE"],
  };

  if (!validConversions[source.documentType]?.includes(targetType)) {
    return NextResponse.json(
      { error: `Cannot convert ${source.documentType} to ${targetType}` },
      { status: 400 }
    );
  }

  // Generate new document number
  const prefix = targetType === "PURCHASE_ORDER" ? "PO" :
                 targetType === "INVOICE" ? "INV" :
                 targetType === "RECEIPT" ? "REC" :
                 targetType === "DELIVERY_NOTE" ? "DN" :
                 targetType === "CREDIT_NOTE" ? "CN" : "DOC";
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const lastDoc = await prisma.document.findFirst({
    where: { documentNo: { startsWith: `${prefix}${yy}${mm}` } },
    orderBy: { documentNo: "desc" },
  });
  const seq = lastDoc ? parseInt(lastDoc.documentNo.slice(-3)) + 1 : 1;
  const documentNo = `${prefix}${yy}${mm}${String(seq).padStart(3, "0")}`;

  // Use custom items if provided, otherwise copy from source
  const items = body.items || source.items.map((item) => ({
    productId: item.productId,
    description: item.description,
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    quantity: Number(item.quantity),
    imageUrl: item.imageUrl,
  }));

  const subtotal = items.reduce(
    (s: number, i: any) => s + (i.unitPrice || 0) * (i.quantity || 0),
    0
  );

  const vatType = body.vatType || source.vatType;
  const vatRate = body.vatRate ?? Number(source.vatRate);
  let vatAmount = 0;
  let total = subtotal;
  if (vatType === "EX_VAT") {
    vatAmount = subtotal * (vatRate / 100);
    total = subtotal + vatAmount;
  } else if (vatType === "IN_VAT") {
    vatAmount = subtotal - subtotal / (1 + vatRate / 100);
  }

  // Calculate dueDate from customer creditTermDays
  const docDate = new Date();
  let dueDate: Date | null = null;
  if (source.customer.creditTermDays > 0) {
    dueDate = new Date(docDate);
    dueDate.setDate(dueDate.getDate() + source.customer.creditTermDays);
  }

  const newDoc = await prisma.document.create({
    data: {
      documentNo,
      documentType: targetType,
      parentDocumentId: source.id,
      customerId: source.customerId,
      date: docDate,
      dueDate,
      paymentTerm: source.customer.creditTermDays > 0 ? `${source.customer.creditTermDays} วัน` : (body.paymentTerm || source.paymentTerm),
      vatType,
      vatRate,
      subtotal,
      vatAmount,
      total,
      showImages: body.showImages ?? source.showImages,
      showSignature: body.showSignature ?? true,
      status: "DRAFT",
      referenceNo: source.documentNo,
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

  return NextResponse.json(newDoc, { status: 201 });
}
