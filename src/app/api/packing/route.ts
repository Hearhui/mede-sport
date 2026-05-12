import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const packingLists = await prisma.packingList.findMany({
    include: {
      document: { include: { customer: true } },
      boxes: { include: { items: { include: { documentItem: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ packingLists });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Generate packing number
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const last = await prisma.packingList.findFirst({
    where: { packingNo: { startsWith: `PK${yy}${mm}` } },
    orderBy: { packingNo: "desc" },
  });
  const seq = last ? parseInt(last.packingNo.slice(-3)) + 1 : 1;
  const packingNo = `PK${yy}${mm}${String(seq).padStart(3, "0")}`;

  const boxes: {
    boxNumber: number;
    boxLabel: string;
    weight?: string;
    dimensions?: string;
    items: { documentItemId: number; quantity: number }[];
  }[] = body.boxes;

  const packingList = await prisma.packingList.create({
    data: {
      packingNo,
      documentId: body.documentId,
      totalBoxes: boxes.length,
      notes: body.notes,
      boxes: {
        create: boxes.map((box) => ({
          boxNumber: box.boxNumber,
          boxLabel: box.boxLabel || `กล่องที่ ${box.boxNumber}`,
          weight: box.weight,
          dimensions: box.dimensions,
          items: {
            create: box.items.map((item) => ({
              documentItemId: item.documentItemId,
              quantity: item.quantity,
            })),
          },
        })),
      },
    },
    include: {
      document: { include: { customer: true } },
      boxes: { include: { items: { include: { documentItem: true } } } },
    },
  });

  return NextResponse.json(packingList, { status: 201 });
}
