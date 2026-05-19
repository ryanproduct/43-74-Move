import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Move HQ",
  description: "Private household app for the 43 Hogarth → 74 Addison move.",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  applicationName: "Move HQ",
  appleWebApp: {
    capable: true,
    title: "Move HQ",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#F2EDE3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
