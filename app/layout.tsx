import "./globals.css";
import { Inter } from "next/font/google";
import type React from "react";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata = {
  title: "Store Spots Booking",
  description: "Бронирование дополнительных зон продажи в магазинах",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-100`}>
        <Providers session={session}>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

