import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#28564e",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "梦屿 · 私人梦境档案";
  const description = "记录、理解并创作你的梦。支持草稿续写、双轨解读、长期洞察与梦境创作。";
  return {
    metadataBase,
    title,
    description,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },
    appleWebApp: {
      capable: true,
      title: "梦屿",
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      title,
      description,
      locale: "zh_CN",
      images: [{ url: "/og.png", width: 1731, height: 909, alt: "梦屿 · 记录、理解并创作你的梦" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
