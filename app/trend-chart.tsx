"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MarketRow } from "./market-types";

type Timeframe = "day" | "week" | "month";
type ChartMode = "line" | "candle";

function aggregate(rows: MarketRow[], timeframe: Timeframe) {
  if (timeframe === "day") return rows;
  const groups = new Map<string, MarketRow[]>();
  for (const row of rows) {
    const date = new Date(`${row.date}T00:00:00Z`);
    let key: string;
    if (timeframe === "month") {
      key = row.date.slice(0, 7);
    } else {
      const monday = new Date(date);
      const day = monday.getUTCDay() || 7;
      monday.setUTCDate(monday.getUTCDate() - day + 1);
      key = monday.toISOString().slice(0, 10);
    }
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.values()].map((list) => ({
    date: list.at(-1)!.date,
    open: list[0].open,
    high: Math.max(...list.map((item) => item.high)),
    low: Math.min(...list.map((item) => item.low)),
    close: list.at(-1)!.close,
    volume: list.reduce((sum, item) => sum + item.volume, 0),
  }));
}

function sma(rows: MarketRow[], period: number) {
  return rows.map((_, index) => {
    if (index + 1 < period) return null;
    const sample = rows.slice(index + 1 - period, index + 1);
    return Number((sample.reduce((sum, item) => sum + item.close, 0) / period).toFixed(2));
  });
}

export function TrendChart({ rows, symbol }: { rows: MarketRow[]; symbol: string }) {
  const chartElement = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<import("echarts").ECharts | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("day");
  const [mode, setMode] = useState<ChartMode>("line");
  const [showTable, setShowTable] = useState(false);
  const periodRows = useMemo(() => aggregate(rows, timeframe), [rows, timeframe]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!chartElement.current) return;
      const echarts = await import("echarts");
      if (cancelled || !chartElement.current) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const chart = chartInstance.current ?? echarts.init(chartElement.current, undefined, { renderer: "canvas" });
      chartInstance.current = chart;
      const dates = periodRows.map((row) => row.date);
      const priceData = mode === "candle"
        ? periodRows.map((row) => [row.open, row.close, row.low, row.high])
        : periodRows.map((row) => row.close);
      const maShortPeriod = timeframe === "day" ? 20 : timeframe === "week" ? 10 : 6;
      const maLongPeriod = timeframe === "day" ? 50 : timeframe === "week" ? 26 : 12;
      const series = [
        {
          name: symbol,
          type: mode === "candle" ? "candlestick" : "line",
          data: priceData,
          smooth: mode === "line" ? 0.22 : false,
          showSymbol: false,
          symbol: "none",
          lineStyle: { width: 2.7, color: symbol === "VOO" ? "#58e1d5" : "#d6f65f" },
          areaStyle: mode === "line" ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: symbol === "VOO" ? "rgba(88,225,213,.24)" : "rgba(214,246,95,.22)" },
              { offset: 1, color: "rgba(8,17,19,0)" },
            ]),
          } : undefined,
          itemStyle: mode === "candle" ? {
            color: "#36d6c8", color0: "#ff7b78", borderColor: "#36d6c8", borderColor0: "#ff7b78",
          } : undefined,
        },
        {
          name: `均线 ${maShortPeriod}`,
          type: "line",
          data: sma(periodRows, maShortPeriod),
          showSymbol: false,
          symbol: "none",
          smooth: 0.2,
          lineStyle: { width: 1.4, color: "#ffc861", type: "solid" },
        },
        {
          name: `均线 ${maLongPeriod}`,
          type: "line",
          data: sma(periodRows, maLongPeriod),
          showSymbol: false,
          symbol: "none",
          smooth: 0.2,
          lineStyle: { width: 1.3, color: "#9da9ff", type: "dashed" },
        },
      ];
      chart.setOption({
        animation: !reduceMotion,
        animationDuration: reduceMotion ? 0 : 650,
        animationEasing: "cubicOut",
        backgroundColor: "transparent",
        color: ["#58e1d5", "#ffc861", "#9da9ff"],
        legend: {
          top: 4,
          left: 0,
          textStyle: { color: "#8da09b", fontSize: 11 },
          itemWidth: 18,
          itemHeight: 3,
        },
        grid: { left: 7, right: 14, top: 44, bottom: 50, containLabel: true },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(16,28,31,.96)",
          borderColor: "rgba(255,255,255,.12)",
          textStyle: { color: "#eaf2ef", fontSize: 12 },
          axisPointer: { type: "cross", lineStyle: { color: "rgba(255,255,255,.2)" } },
          valueFormatter: (value: unknown) => Array.isArray(value)
            ? value.map((item) => `$${Number(item).toFixed(2)}`).join(" / ")
            : `$${Number(value).toFixed(2)}`,
        },
        xAxis: {
          type: "category",
          data: dates,
          boundaryGap: mode === "candle",
          axisLine: { lineStyle: { color: "rgba(255,255,255,.12)" } },
          axisTick: { show: false },
          axisLabel: { color: "#667974", fontSize: 10, hideOverlap: true },
        },
        yAxis: {
          scale: true,
          splitNumber: 5,
          axisLabel: { color: "#667974", fontSize: 10, formatter: (value: number) => `$${value}` },
          splitLine: { lineStyle: { color: "rgba(255,255,255,.065)", type: "dashed" } },
        },
        dataZoom: [
          { type: "inside", start: timeframe === "day" ? 66 : 0, end: 100, minValueSpan: 20 },
          {
            type: "slider", start: timeframe === "day" ? 66 : 0, end: 100, height: 18, bottom: 8,
            borderColor: "transparent", backgroundColor: "rgba(255,255,255,.03)", fillerColor: "rgba(88,225,213,.12)",
            handleStyle: { color: "#58e1d5", borderColor: "#58e1d5" }, textStyle: { color: "#647671" },
          },
        ],
        series,
      }, true);
    };
    render();
    const observer = new ResizeObserver(() => chartInstance.current?.resize());
    if (chartElement.current) observer.observe(chartElement.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [mode, periodRows, symbol, timeframe]);

  useEffect(() => () => chartInstance.current?.dispose(), []);

  return (
    <section className="chart-card" aria-labelledby="trend-chart-title">
      <div className="chart-toolbar">
        <div>
          <span className="micro-label">PRICE TREND</span>
          <h2 id="trend-chart-title">{symbol} 价格趋势</h2>
        </div>
        <div className="chart-controls">
          <div className="segmented" aria-label="时间周期">
            {(["day", "week", "month"] as const).map((item) => (
              <button key={item} className={timeframe === item ? "active" : ""} onClick={() => setTimeframe(item)} type="button">
                {item === "day" ? "日线" : item === "week" ? "周线" : "月线"}
              </button>
            ))}
          </div>
          <div className="segmented" aria-label="图表类型">
            <button className={mode === "line" ? "active" : ""} onClick={() => setMode("line")} type="button">趋势线</button>
            <button className={mode === "candle" ? "active" : ""} onClick={() => setMode("candle")} type="button">K 线</button>
          </div>
        </div>
      </div>
      <p className="chart-hint">拖动底部区间可缩放；悬停查看当日数据。实线与虚线均线帮助区分短、中期方向。</p>
      <div ref={chartElement} className="echart" role="img" aria-label={`${symbol} ${timeframe === "day" ? "日" : timeframe === "week" ? "周" : "月"}度价格与均线趋势图`} />
      <button className="table-toggle" type="button" onClick={() => setShowTable((value) => !value)} aria-expanded={showTable}>
        {showTable ? "收起原始数据" : "查看最近 10 期原始数据"}
      </button>
      {showTable && (
        <div className="data-table-wrap">
          <table>
            <caption className="sr-only">{symbol} 最近 10 期行情</caption>
            <thead><tr><th>日期</th><th>开盘</th><th>最高</th><th>最低</th><th>收盘</th></tr></thead>
            <tbody>{periodRows.slice(-10).reverse().map((row) => (
              <tr key={row.date}><td>{row.date}</td><td>${row.open.toFixed(2)}</td><td>${row.high.toFixed(2)}</td><td>${row.low.toFixed(2)}</td><td>${row.close.toFixed(2)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
