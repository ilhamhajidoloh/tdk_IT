import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบจัดการโรงเรียน",
  description: "ระบบจัดการคะแนนและข้อมูลนักเรียน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-[var(--font-kanit)] bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">{children}</body>
    </html>
  );
}
