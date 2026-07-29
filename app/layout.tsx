import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "梦屿 · 私人梦境档案", description: "记录梦、理解梦，也看见反复出现的内在线索。", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){ return <html lang="zh-CN"><body>{children}</body></html>; }
