import type { Metadata } from "next";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

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
      <body className="bg-main-50 text-main-900 antialiased">{children}</body>
    </html>
  );
}
