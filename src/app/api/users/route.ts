import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ users });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const data: any = {};
  if (body.role !== undefined) data.role = body.role;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.name !== undefined) data.name = body.name;

  // Change password
  if (body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }
    data.password = await bcrypt.hash(body.newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
  });
  return NextResponse.json(user);
}
