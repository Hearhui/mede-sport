import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password || password.length < 6) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ (รหัสผ่านอย่างน้อย 6 ตัว)" }, { status: 400 });
  }

  // Only allow registration if: no users exist yet OR requester is an ADMIN
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "การสมัครสมาชิกถูกปิด กรุณาติดต่อผู้ดูแลระบบ" }, { status: 403 });
    }
    // Check if requester is ADMIN
    const requester = await prisma.user.findUnique({ where: { email: token.email as string } });
    if (!requester || requester.role !== "ADMIN") {
      return NextResponse.json({ error: "เฉพาะ Admin เท่านั้นที่สามารถเพิ่มผู้ใช้ได้" }, { status: 403 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "อีเมลนี้มีผู้ใช้แล้ว" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const role = userCount === 0 ? "ADMIN" : "STAFF";

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
}
