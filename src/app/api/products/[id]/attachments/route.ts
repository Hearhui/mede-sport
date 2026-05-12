import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachments = await prisma.productAttachment.findMany({
    where: { productId: parseInt(id) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ attachments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const note = formData.get("note") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 10MB" }, { status: 400 });
  }

  const blob = await put(`attachments/${Date.now()}-${file.name}`, file, { access: "public" });

  const attachment = await prisma.productAttachment.create({
    data: {
      productId: parseInt(id),
      fileName: file.name,
      fileUrl: blob.url,
      fileType: file.name.split(".").pop() || null,
      fileSize: file.size,
      note: note || null,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const attachmentId = parseInt(req.nextUrl.searchParams.get("attachmentId") || "0");
  if (!attachmentId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  await prisma.productAttachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ ok: true });
}
