import vooData from "@/public/data/voo.json";
import qqqData from "@/public/data/qqq.json";
import type { MarketData } from "./market-types";

export const marketData = {
  VOO: vooData as MarketData,
  QQQ: qqqData as MarketData,
};
