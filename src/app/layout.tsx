import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marketia Decision Support",
  description:
    "A market intelligence platform for farmers, entrepreneurs, buyers, and market officers in Tanzania.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-main-50 text-main-900 antialiased`}>{children}</body>
    </html>
  );
}
