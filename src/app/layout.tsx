import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

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
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
