import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const assetBase = process.env.GITHUB_PAGES === "true" ? "/buy-compass-etf-cn" : "";

export const metadata: Metadata = {
  metadataBase: new URL("https://liuziyu-ultra.github.io/buy-compass-etf-cn"),
  title: "趋势雷达｜VOO 与 QQQ",
  description: "自动更新的 VOO 与 QQQ 趋势分析网页。",
  icons: {
    icon: `${assetBase}/favicon.svg`,
    shortcut: `${assetBase}/favicon.svg`,
  },
  openGraph: {
    title: "趋势雷达｜VOO 与 QQQ 自动趋势分析",
    description: "日周月趋势、均线、RSI、波动率与回撤，用人话生成规则化提示。",
    images: [`${assetBase}/og.png`],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
