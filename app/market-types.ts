export type MarketRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketData = {
  symbol: "VOO" | "QQQ";
  name: string;
  shortName: string;
  index: string;
  expenseRatio: number;
  profileUrl: string;
  currency: "USD";
  lastMarketDate: string;
  generatedAt: string;
  source: { name: string; url: string; note: string };
  metrics: {
    latestPrice: number;
    dayChange: number;
    high52: number;
    low52: number;
    drawdown52: number;
    ma20: number;
    ma50: number;
    ma200: number;
    rsi14: number;
    volatility20: number;
    volumeRatio20: number;
    returns: { month1: number; month3: number; month6: number; year1: number };
    maxDrawdown1y: number;
    score: number;
    state: string;
    tone: "positive" | "neutral" | "caution" | "negative";
    actionTitle: string;
    actionSummary: string;
  };
  rows: MarketRow[];
};
