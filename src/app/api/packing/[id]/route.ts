import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packingList = await prisma.packingList.findUnique({
    where: { id: parseInt(id) },
    include: {
      document: { include: { customer: true, items: { orderBy: { itemNo: "asc" } } } },
      boxes: {
        orderBy: { boxNumber: "asc" },
        include: { items: { include: { documentItem: true } } },
      },
    },
  });

  if (!packingList) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(packingList);
}
