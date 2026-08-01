import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BarChart3, CircleAlert, Gauge, Info, ShieldCheck, Waves } from "lucide-react";
import type { MarketData } from "./market-types";
import { SiteHeader } from "./site-header";
import { TrendChart } from "./trend-chart";

const fmtMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const fmtPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
const dateCN = (value: string) => new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

function ReturnBars({ data }: { data: MarketData }) {
  const returns = [
    ["近 1 月", data.metrics.returns.month1],
    ["近 3 月", data.metrics.returns.month3],
    ["近 6 月", data.metrics.returns.month6],
    ["近 1 年", data.metrics.returns.year1],
  ] as const;
  const max = Math.max(8, ...returns.map(([, value]) => Math.abs(value)));
  return (
    <article className="analysis-card returns-card">
      <div className="card-heading"><div><span className="micro-label">MOMENTUM</span><h3>多周期动量</h3></div><BarChart3 size={18} /></div>
      <p className="card-explain">同时看短、中、长周期，避免被某一天的涨跌带偏。</p>
      <div className="return-bars">
        {returns.map(([label, value]) => (
          <div className="return-row" key={label}>
            <span>{label}</span>
            <div className="return-track"><i className={value >= 0 ? "up" : "down"} style={{ width: `${Math.max(5, Math.abs(value) / max * 100)}%` }} /></div>
            <b className={value >= 0 ? "positive" : "negative"}>{fmtPercent(value)}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function RsiCard({ data }: { data: MarketData }) {
  const rsi = data.metrics.rsi14;
  const label = rsi >= 70 ? "短线偏热" : rsi <= 30 ? "短线超卖" : rsi >= 55 ? "动能偏强" : rsi <= 45 ? "动能偏弱" : "动能中性";
  return (
    <article className="analysis-card rsi-card">
      <div className="card-heading"><div><span className="micro-label">RSI · 14 DAYS</span><h3>短线温度</h3></div><Gauge size={18} /></div>
      <div className="rsi-value"><strong>{rsi.toFixed(1)}</strong><span>{label}</span></div>
      <div className="rsi-scale" aria-label={`RSI 14 为 ${rsi.toFixed(1)}`}><i style={{ left: `${Math.max(2, Math.min(98, rsi))}%` }} /></div>
      <div className="rsi-labels"><span>0 超卖</span><span>50 中性</span><span>100 过热</span></div>
      <p>RSI 只描述近期速度，不是买卖开关。强趋势里可能长期偏热，弱趋势里也可能反复超卖。</p>
    </article>
  );
}

function Method({ data }: { data: MarketData }) {
  return (
    <section className="method-section" id="method">
      <div className="section-heading">
        <div><span className="micro-label">HOW TO READ</span><h2>这份结论怎么生成？</h2></div>
        <p>不是 AI 猜明天涨跌，而是每天收盘后用同一套规则重算，让结论可复查、可解释。</p>
      </div>
      <div className="method-grid">
        <article><span>01</span><h3>趋势结构</h3><p>比较现价与 20、50、200 日均线。价格和均线同向排列时，趋势更完整。</p></article>
        <article><span>02</span><h3>动量温度</h3><p>用 RSI 和 1/3/6/12 月收益判断速度，防止只看一根大阳线或一条新闻。</p></article>
        <article><span>03</span><h3>波动与回撤</h3><p>用 20 日年化波动、52 周高点回撤和一年最大回撤估算持有过程有多颠簸。</p></article>
        <article><span>04</span><h3>规则化提示</h3><p>把信号翻译成“维持定投、拆小单、控制加仓”等操作语言，但不预测底部。</p></article>
      </div>
      <div className="method-note"><Info size={17} /><p>趋势分数是站内的相对状态指标，不代表未来收益概率。历史表现不保证未来结果，任何 ETF 都可能出现快速且较深的回撤。</p></div>
      <div className="source-strip">
        <div><b>行情日期</b><span>{dateCN(data.lastMarketDate)}</span></div>
        <div><b>自动生成</b><span>{new Date(data.generatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</span></div>
        <div><b>行情源</b><a href={data.source.url} target="_blank" rel="noreferrer">{data.source.name} <ArrowUpRight size={13} /></a></div>
        <div><b>基金资料</b><a href={data.profileUrl} target="_blank" rel="noreferrer">发行方官方页面 <ArrowUpRight size={13} /></a></div>
      </div>
    </section>
  );
}

export function AssetDashboard({ data, peer }: { data: MarketData; peer: MarketData }) {
  const m = data.metrics;
  const dayTone = m.dayChange >= 0 ? "positive" : "negative";
  const drawdownLevel = Math.abs(m.drawdown52) >= 20 ? "回撤加深" : Math.abs(m.drawdown52) >= 10 ? "进入观察" : "接近高位区";
  return (
    <main className={`market-site theme-${data.symbol.toLowerCase()}`}>
      <SiteHeader active={data.symbol} />
      <section className="asset-hero">
        <div className="hero-title-block">
          <Link className="back-link" href="/"><ArrowLeft size={15} /> 两只 ETF 总览</Link>
          <div className="ticker-line"><span className="ticker-badge">{data.symbol}</span><span>{data.shortName}</span></div>
          <h1>{data.symbol} 趋势分析</h1>
          <p>{data.symbol === "VOO" ? "用更广泛的美国大盘股做长期核心仓，重点观察整体市场趋势与回撤。" : "聚焦大型成长公司，趋势弹性通常更高，也要更认真看波动与估值敏感度。"}</p>
        </div>
        <div className="hero-price-block">
          <span>最近收盘 · {data.currency}</span>
          <strong>{fmtMoney(m.latestPrice)}</strong>
          <div><b className={dayTone}>{fmtPercent(m.dayChange)}</b><span>当日</span><i /><b className={m.drawdown52 > -10 ? "neutral" : "negative"}>{fmtPercent(m.drawdown52)}</b><span>距 52 周高点</span></div>
          <small>数据截至 {dateCN(data.lastMarketDate)} · 日终数据</small>
        </div>
      </section>

      <section className="signal-summary">
        <article className={`main-signal tone-${m.tone}`}>
          <div className="signal-orbit" style={{ "--score": `${m.score * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{m.score}</strong><span>趋势分</span></div>
          </div>
          <div className="signal-copy"><span className="micro-label">RULE-BASED VIEW</span><h2>{m.actionTitle}</h2><p>{m.actionSummary}</p><div className="signal-tags"><span>{m.state}</span><span>{drawdownLevel}</span><span>非收益预测</span></div></div>
        </article>
        <article className="risk-note"><CircleAlert size={20} /><div><span>今天最该注意</span><h3>{m.rsi14 >= 70 ? "上涨不等于适合一次买满" : m.latestPrice < m.ma200 ? "长期均线下方，耐心比预测重要" : "趋势偏强时，也要为回撤留现金"}</h3><p>{data.symbol === "QQQ" ? "QQQ 的成长风格更集中；与 VOO 重叠买入并不等于完全分散。" : "VOO 覆盖更广，但仍是 100% 美国大型股票资产，并不是保本产品。"}</p></div></article>
      </section>

      <section className="metric-grid" aria-label="核心指标">
        <article><span>20 / 50 / 200 日均线</span><strong>{fmtMoney(m.ma20)}</strong><small>{fmtMoney(m.ma50)} / {fmtMoney(m.ma200)}</small><i className={m.latestPrice > m.ma200 ? "good" : "bad"} /></article>
        <article><span>52 周区间</span><strong>{fmtMoney(m.low52)}</strong><small>至 {fmtMoney(m.high52)}</small><i className="range-dot" /></article>
        <article><span>20 日年化波动</span><strong>{m.volatility20.toFixed(1)}%</strong><small>{m.volatility20 < 18 ? "近期波动温和" : m.volatility20 < 28 ? "近期波动中等" : "近期波动较高"}</small><Waves size={18} /></article>
        <article><span>一年最大回撤</span><strong>{m.maxDrawdown1y.toFixed(1)}%</strong><small>持有体验参考，不代表上限</small><ShieldCheck size={18} /></article>
      </section>

      <TrendChart rows={data.rows} symbol={data.symbol} />

      <section className="analysis-grid">
        <ReturnBars data={data} />
        <RsiCard data={data} />
        <article className="analysis-card comparison-card">
          <div className="card-heading"><div><span className="micro-label">VOO VS QQQ</span><h3>和 {peer.symbol} 放在一起看</h3></div><ArrowUpRight size={18} /></div>
          <div className="peer-row"><span>近 1 年收益</span><b>{data.symbol} {fmtPercent(m.returns.year1)}</b><b>{peer.symbol} {fmtPercent(peer.metrics.returns.year1)}</b></div>
          <div className="peer-row"><span>20 日波动</span><b>{data.symbol} {m.volatility20.toFixed(1)}%</b><b>{peer.symbol} {peer.metrics.volatility20.toFixed(1)}%</b></div>
          <div className="peer-row"><span>基金年费率</span><b>{data.symbol} {data.expenseRatio.toFixed(2)}%</b><b>{peer.symbol} {peer.expenseRatio.toFixed(2)}%</b></div>
          <p>{data.symbol === "VOO" ? "VOO 通常更适合作为核心仓；QQQ 可作为成长倾斜，但两者都有大型科技股重叠。" : "QQQ 的集中度和波动通常高于 VOO；长期持有前先确认自己能否承受更大的中途回撤。"}</p>
          <Link className="peer-link" href={`/${peer.symbol.toLowerCase()}`}>打开 {peer.symbol} 完整分析 <ArrowUpRight size={14} /></Link>
        </article>
      </section>

      <Method data={data} />
      <footer className="site-footer"><div className="brand"><span className="brand-icon"><BarChart3 size={16} /></span><span><b>趋势雷达</b><small>ETF SIGNAL LAB</small></span></div><p>仅用于投资教育与趋势观察，不构成个性化投资建议。请结合资金期限、备用金和承受能力独立决策。</p><span>每日交易日后自动更新</span></footer>
    </main>
  );
}
