import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "มีดี สปอร์ต - ระบบจัดการร้านค้า",
  description: "ระบบจัดการสต็อค เอกสาร และการขายสำหรับ มีดี สปอร์ต",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
