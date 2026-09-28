import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Geist, Newsreader } from "next/font/google";
import branding from "@/data/branding.json";
import type { Branding } from "@/types/branding";
import "./globals.css";

const uiFont = Geist({
  variable: "--font-ui",
  subsets: ["latin"],
});

const serifFont = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal"],
});

const siteBranding: Branding = branding;

export const metadata: Metadata = {
  title: siteBranding.siteName,
  description: siteBranding.tagline,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#131211" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const brandStyle = { "--brand": siteBranding.primaryColor } as CSSProperties;

  return (
    <html lang="en" style={brandStyle} className={`${uiFont.variable} ${serifFont.variable} h-full antialiased`}>
      <body className="flex h-full min-h-dvh flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
