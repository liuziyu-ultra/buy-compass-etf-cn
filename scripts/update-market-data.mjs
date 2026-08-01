import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ASSETS = {
  VOO: {
    name: "Vanguard S&P 500 ETF",
    shortName: "标普 500 核心",
    index: "S&P 500",
    expenseRatio: 0.03,
    profileUrl: "https://investor.vanguard.com/investment-products/etfs/profile/voo",
  },
  QQQ: {
    name: "Invesco QQQ Trust",
    shortName: "纳斯达克 100 成长",
    index: "Nasdaq-100",
    expenseRatio: 0.18,
    profileUrl: "https://www.invesco.com/us/financial-products/etfs/product-detail?productId=QQQ",
  },
};

const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const round = (value, digits = 2) => value == null || !Number.isFinite(value) ? null : Number(value.toFixed(digits));
const percentChange = (latest, earlier) => earlier ? ((latest / earlier) - 1) * 100 : null;

function sma(rows, period, index = rows.length - 1) {
  if (index + 1 < period) return null;
  return average(rows.slice(index + 1 - period, index + 1).map((row) => row.close));
}

function rsi(rows, period = 14) {
  if (rows.length <= period) return null;
  const changes = rows.slice(-(period + 1)).slice(1).map((row, index) => row.close - rows.slice(-(period + 1))[index].close);
  const gains = average(changes.map((value) => Math.max(value, 0))) ?? 0;
  const losses = average(changes.map((value) => Math.max(-value, 0))) ?? 0;
  if (losses === 0) return 100;
  return 100 - (100 / (1 + gains / losses));
}

function annualizedVolatility(rows, days = 20) {
  const sample = rows.slice(-(days + 1));
  if (sample.length < 3) return null;
  const returns = sample.slice(1).map((row, index) => Math.log(row.close / sample[index].close));
  const mean = average(returns) ?? 0;
  const variance = average(returns.map((value) => (value - mean) ** 2)) ?? 0;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function maxDrawdown(rows) {
  let peak = -Infinity;
  let worst = 0;
  for (const row of rows) {
    peak = Math.max(peak, row.close);
    worst = Math.min(worst, ((row.close / peak) - 1) * 100);
  }
  return worst;
}

function trendMetrics(rows) {
  const last = rows.at(-1);
  const year = rows.slice(-252);
  const high52 = Math.max(...year.map((row) => row.high));
  const low52 = Math.min(...year.map((row) => row.low));
  const ma20 = sma(rows, 20);
  const ma50 = sma(rows, 50);
  const ma200 = sma(rows, 200);
  const rsi14 = rsi(rows);
  const vol20 = annualizedVolatility(rows);
  const volume20 = average(rows.slice(-20).map((row) => row.volume));
  const returnFor = (days) => percentChange(last.close, rows.at(-Math.min(days + 1, rows.length))?.close);

  let score = 50;
  if (ma20) score += last.close > ma20 ? 8 : -8;
  if (ma50) score += last.close > ma50 ? 12 : -12;
  if (ma200) score += last.close > ma200 ? 15 : -15;
  if (ma20 && ma50) score += ma20 > ma50 ? 6 : -6;
  if (rsi14 != null) {
    if (rsi14 >= 45 && rsi14 <= 65) score += 5;
    if (rsi14 >= 75) score -= 8;
    if (rsi14 <= 30) score -= 3;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));

  const drawdown52 = percentChange(last.close, high52);
  let state = "震荡整理";
  let tone = "neutral";
  if (ma20 && ma50 && ma200 && last.close > ma20 && ma20 > ma50 && ma50 > ma200) {
    state = "多周期上行";
    tone = "positive";
  } else if (ma200 && last.close < ma200) {
    state = "长期趋势偏弱";
    tone = "negative";
  } else if (ma50 && last.close > ma50) {
    state = "中期偏强";
    tone = "positive";
  } else if (ma50 && last.close < ma50) {
    state = "中期承压";
    tone = "caution";
  }

  let actionTitle = "维持定投节奏";
  let actionSummary = "当前没有极端信号。长期资金可按原计划分批，不用因单日涨跌改变纪律。";
  if (drawdown52 != null && drawdown52 <= -20) {
    actionTitle = "进入 -20% 回撤观察档";
    actionSummary = "价格较 52 周高点回撤超过 20%。若备用金充足、期限足够长，可按事先设定的档位分批投入，仍不代表已经见底。";
  } else if (rsi14 != null && rsi14 >= 70) {
    actionTitle = "短线偏热，避免追高";
    actionSummary = "RSI 处在偏热区，趋势可能仍强，但短线回摆概率增加。更适合拆小单、按日期买，而不是一次押满。";
  } else if (ma200 && last.close < ma200) {
    actionTitle = "控制单次投入";
    actionSummary = "价格位于 200 日均线下方，长期趋势尚未修复。可保留常规定投，但把加仓资金留给更深回撤或重新站稳后的确认。";
  } else if (tone === "positive") {
    actionTitle = "趋势向上，按计划分批";
    actionSummary = "均线结构偏强，适合继续长期计划；上涨阶段也可能突然回撤，因此不建议因为趋势好就提高杠杆或一次性满仓。";
  }

  return {
    latestPrice: round(last.close),
    dayChange: round(percentChange(last.close, rows.at(-2)?.close)),
    high52: round(high52),
    low52: round(low52),
    drawdown52: round(drawdown52),
    ma20: round(ma20),
    ma50: round(ma50),
    ma200: round(ma200),
    rsi14: round(rsi14, 1),
    volatility20: round(vol20, 1),
    volumeRatio20: round(volume20 ? last.volume / volume20 : null, 2),
    returns: {
      month1: round(returnFor(21)),
      month3: round(returnFor(63)),
      month6: round(returnFor(126)),
      year1: round(returnFor(252)),
    },
    maxDrawdown1y: round(maxDrawdown(year)),
    score,
    state,
    tone,
    actionTitle,
    actionSummary,
  };
}

function cleanNumber(value) {
  const number = Number(String(value ?? "").replaceAll("$", "").replaceAll(",", ""));
  return Number.isFinite(number) ? number : null;
}

async function fetchNasdaq(symbol) {
  const from = new Date();
  from.setUTCFullYear(from.getUTCFullYear() - 3);
  const fromDate = from.toISOString().slice(0, 10);
  const url = `https://api.nasdaq.com/api/quote/${symbol}/historical?assetclass=etf&fromdate=${fromDate}&limit=5000`;
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ETFTrendDashboard/1.0)",
        Accept: "application/json, text/plain, */*",
      },
    });
    if (response.ok) break;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
  }
  if (!response?.ok) throw new Error(`${symbol}: Nasdaq HTTP ${response?.status ?? "unknown"}`);
  const payload = await response.json();
  const rawRows = payload?.data?.tradesTable?.rows;
  if (!Array.isArray(rawRows) || rawRows.length < 250) throw new Error(`${symbol}: insufficient Nasdaq rows`);
  const rows = rawRows.map((row) => {
    const [month, day, year] = row.date.split("/");
    return {
      date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      open: cleanNumber(row.open),
      high: cleanNumber(row.high),
      low: cleanNumber(row.low),
      close: cleanNumber(row.close),
      volume: cleanNumber(row.volume),
    };
  }).filter((row) => Object.values(row).every((value) => value != null)).sort((a, b) => a.date.localeCompare(b.date));
  return { rows, sourceUrl: url };
}

async function main() {
  const outputDir = path.resolve("public/data");
  await mkdir(outputDir, { recursive: true });
  for (const [symbol, profile] of Object.entries(ASSETS)) {
    const { rows, sourceUrl } = await fetchNasdaq(symbol);
    const output = {
      symbol,
      ...profile,
      currency: "USD",
      lastMarketDate: rows.at(-1).date,
      generatedAt: new Date().toISOString(),
      source: {
        name: "Nasdaq Historical API",
        url: sourceUrl,
        note: "日终历史行情；可能延迟、修订或短暂不可用。",
      },
      metrics: trendMetrics(rows),
      rows,
    };
    await writeFile(path.join(outputDir, `${symbol.toLowerCase()}.json`), `${JSON.stringify(output)}\n`);
    console.log(`${symbol}: ${rows.length} rows through ${output.lastMarketDate}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
