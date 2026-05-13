import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const category = req.nextUrl.searchParams.get("category");

  const where: any = {};
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59");
  }
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    take: 200,
  });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.description || !body.amount) {
      return NextResponse.json({ error: "กรุณากรอกรายละเอียดและจำนวนเงิน" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        category: body.category || "อื่นๆ",
        description: body.description,
        amount: parseFloat(body.amount),
        paymentMethod: body.paymentMethod || null,
        receiptUrl: body.receiptUrl || null,
        notes: body.notes || null,
        createdBy: body.createdBy || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.expense.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
