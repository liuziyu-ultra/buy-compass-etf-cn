import type { Metadata } from "next";
import { StrategyDashboard } from "./strategy-dashboard";

export const metadata: Metadata = {
  title: "买入罗盘｜新手 ETF 买入计划",
  description:
    "把资金、回撤和风险偏好，变成一份看得懂、能执行的 VOO / QQQ 长期买入计划。",
  openGraph: {
    title: "买入罗盘｜今天该买多少，一眼看懂",
    description: "定投为主，回撤分档加仓。为长期 ETF 新手做的买入计划工具。",
    images: ["/og.png"],
  },
};

export default function Home() {
  return <StrategyDashboard />;
}
