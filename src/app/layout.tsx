import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import branding from "@/data/branding.json";
import type { Branding } from "@/types/branding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteBranding: Branding = branding;

export const metadata: Metadata = {
  title: siteBranding.siteName,
  description: siteBranding.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const brandStyle = { "--brand": siteBranding.primaryColor } as CSSProperties;

  return (
    <html
      lang="en"
      style={brandStyle}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
