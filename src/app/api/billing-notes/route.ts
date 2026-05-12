import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const billingNotes = await prisma.billingNote.findMany({
    include: {
      customer: true,
      items: { include: { document: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });
  return NextResponse.json({ billingNotes });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const last = await prisma.billingNote.findFirst({
    where: { billingNo: { startsWith: `BN${yy}${mm}` } },
    orderBy: { billingNo: "desc" },
  });
  const seq = last ? parseInt(last.billingNo.slice(-3)) + 1 : 1;
  const billingNo = `BN${yy}${mm}${String(seq).padStart(3, "0")}`;

  const billingNote = await prisma.billingNote.create({
    data: {
      billingNo,
      customerId: body.customerId,
      date: body.date ? new Date(body.date) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes,
      items: {
        create: (body.documentIds || []).map((docId: number) => ({
          documentId: docId,
        })),
      },
    },
    include: { items: { include: { document: true } }, customer: true },
  });

  return NextResponse.json(billingNote, { status: 201 });
}
