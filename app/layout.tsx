import type { Metadata, Viewport } from "next";
import { Inter, Sarabun, Noto_Naskh_Arabic, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const arabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const arabicSans = Noto_Sans_Arabic({
  variable: "--font-arabic-sans",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ระบบจัดการโรงเรียน",
  description: "ระบบจัดการคะแนนและข้อมูลนักเรียน",
  icons: {
    icon: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

import { Providers } from "./providers";
import InstallPrompt from "./components/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${sarabun.variable} ${arabic.variable} ${arabicSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        <Providers>
          {children}
        </Providers>
        <InstallPrompt />
      </body>
    </html>
  );
}
