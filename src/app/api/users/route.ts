import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: body.id },
    data: { role: body.role, isActive: body.isActive },
  });
  return NextResponse.json(user);
}
