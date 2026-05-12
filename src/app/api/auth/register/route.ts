import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้มีผู้ใช้แล้ว" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // First user becomes ADMIN
  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "ADMIN" : "STAFF";

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
}
