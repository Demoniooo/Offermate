import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OfferMate — 60 秒拿到 HR 视角的简历诊断",
  description:
    "面向校招学生的 AI 求职教练：粘贴简历看见 HR 怎么看你，输入岗位 JD 进入多轮追问的模拟面试，一份可反复对比、不断打磨的求职复盘。",
};

// 没有它，移动端会按 ~980px 桌面布局缩放渲染，所有手机断点都不触发
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>{children}<Analytics /></body>
    </html>
  );
}
