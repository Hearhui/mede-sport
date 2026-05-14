import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Documents with dueDate that are not PAID or CANCELLED
  const creditDocs = await prisma.document.findMany({
    where: {
      dueDate: { not: null },
      status: { notIn: ["PAID", "CANCELLED"] },
      documentType: { in: ["INVOICE", "PURCHASE_ORDER", "DELIVERY_NOTE", "RECEIPT"] },
    },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });

  const notifications: {
    id: number;
    type: "overdue" | "due_soon" | "due_today";
    documentNo: string;
    documentType: string;
    customerName: string;
    dueDate: string;
    total: number;
    daysLeft: number;
  }[] = [];

  for (const doc of creditDocs) {
    if (!doc.dueDate) continue;
    const dueDate = new Date(doc.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = dueDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let type: "overdue" | "due_soon" | "due_today";
    if (daysLeft < 0) {
      type = "overdue";
    } else if (daysLeft === 0) {
      type = "due_today";
    } else if (daysLeft <= 7) {
      type = "due_soon";
    } else {
      continue; // Skip docs with more than 7 days left
    }

    notifications.push({
      id: doc.id,
      type,
      documentNo: doc.documentNo,
      documentType: doc.documentType,
      customerName: doc.customer.name,
      dueDate: doc.dueDate.toISOString(),
      total: Number(doc.total),
      daysLeft,
    });
  }

  // Sort: overdue first, then due_today, then due_soon
  notifications.sort((a, b) => a.daysLeft - b.daysLeft);

  return NextResponse.json({
    notifications,
    summary: {
      overdue: notifications.filter((n) => n.type === "overdue").length,
      dueToday: notifications.filter((n) => n.type === "due_today").length,
      dueSoon: notifications.filter((n) => n.type === "due_soon").length,
      total: notifications.length,
    },
  });
}
