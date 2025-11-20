import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OffMarket Hunter - Find Motivated Sellers",
  description: "Track off-market properties and find motivated sellers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
