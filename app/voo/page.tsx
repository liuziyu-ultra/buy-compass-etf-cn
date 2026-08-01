import type { Metadata } from "next";
import { AssetDashboard } from "../asset-dashboard";
import { marketData } from "../market-data";

export const metadata: Metadata = { title: "VOO 趋势分析｜趋势雷达", description: "VOO 日、周、月趋势图，均线、RSI、波动率、回撤与规则化买入提示。" };

export default function VooPage() {
  return <AssetDashboard data={marketData.VOO} peer={marketData.QQQ} />;
}
