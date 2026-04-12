import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AndroidSafeArea } from "@/components/AndroidSafeArea";

export const metadata: Metadata = {
  title: "Betting Companion",
  description: "Roguelike betting strategy companion for tracking bets and making decisions",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BetComp",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased bg-slate-900">
        <AndroidSafeArea />
        {children}
      </body>
    </html>
  );
}
