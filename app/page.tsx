import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CheckCircle2, CircleAlert, LineChart, RefreshCw, ShieldCheck } from "lucide-react";
import { marketData } from "./market-data";
import { SiteHeader } from "./site-header";

export const metadata: Metadata = {
  title: "趋势雷达｜VOO 与 QQQ 自动趋势分析",
  description: "自动更新 VOO、QQQ 日周月趋势，比较均线、RSI、波动率、回撤和多周期动量，用人话生成规则化提示。",
};

const fmtPercent = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

function FundCard({ symbol }: { symbol: "VOO" | "QQQ" }) {
  const data = marketData[symbol];
  const metrics = data.metrics;
  return (
    <Link className={`fund-card fund-${symbol.toLowerCase()}`} href={`/${symbol.toLowerCase()}`}>
      <div className="fund-top"><span className="ticker-badge">{symbol}</span><span className={`state-pill tone-${metrics.tone}`}>{metrics.state}</span></div>
      <div className="fund-name"><span>{data.shortName}</span><h2>{data.index}</h2></div>
      <div className="fund-price"><strong>${metrics.latestPrice.toFixed(2)}</strong><b className={metrics.dayChange >= 0 ? "positive" : "negative"}>{fmtPercent(metrics.dayChange)}</b></div>
      <div className="mini-stats">
        <div><span>近 1 年</span><b>{fmtPercent(metrics.returns.year1)}</b></div>
        <div><span>距高点</span><b>{fmtPercent(metrics.drawdown52)}</b></div>
        <div><span>波动率</span><b>{metrics.volatility20.toFixed(1)}%</b></div>
      </div>
      <div className="fund-advice"><span>当前提示</span><h3>{metrics.actionTitle}</h3><p>{metrics.actionSummary}</p></div>
      <div className="fund-link">进入 {symbol} 趋势页 <ArrowUpRight size={15} /></div>
    </Link>
  );
}

export default function Home() {
  const latest = marketData.VOO.lastMarketDate;
  return (
    <main className="market-site overview-site">
      <SiteHeader />
      <section className="overview-hero">
        <div className="overview-copy">
          <div className="live-pill"><i /> 行情已同步至 {latest}</div>
          <h1>不是猜涨跌。<br /><em>是看清趋势。</em></h1>
          <p>每天自动更新 VOO 与 QQQ，用均线、动量、波动和回撤交叉验证，再把信号翻译成新手也能执行的提示。</p>
          <div className="overview-actions"><Link className="primary-cta" href="/voo">先看 VOO <ArrowUpRight size={16} /></Link><Link className="secondary-cta" href="/qqq">查看 QQQ</Link></div>
          <div className="trust-row"><span><CheckCircle2 size={15} /> 日 / 周 / 月切换</span><span><CheckCircle2 size={15} /> 趋势线 / K 线</span><span><CheckCircle2 size={15} /> 每条建议可解释</span></div>
        </div>
        <div className="hero-visual" aria-label="趋势分析流程示意">
          <div className="visual-grid" />
          <svg viewBox="0 0 600 320" role="img" aria-label="平滑上行趋势示意图">
            <defs><linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#50ddd1"/><stop offset="1" stopColor="#d7f75f"/></linearGradient><linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#50ddd1" stopOpacity=".24"/><stop offset="1" stopColor="#50ddd1" stopOpacity="0"/></linearGradient></defs>
            <path className="hero-area" d="M20 260 C75 245 105 270 155 214 S235 205 290 164 S370 188 414 114 S500 105 580 54 L580 300 L20 300Z" fill="url(#heroArea)" />
            <path className="hero-line" d="M20 260 C75 245 105 270 155 214 S235 205 290 164 S370 188 414 114 S500 105 580 54" fill="none" stroke="url(#heroLine)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="580" cy="54" r="8" fill="#d7f75f" stroke="#0b1517" strokeWidth="5" />
          </svg>
          <div className="float-card float-one"><LineChart size={16} /><span>趋势结构</span><b>多周期上行</b></div>
          <div className="float-card float-two"><RefreshCw size={16} /><span>自动更新</span><b>交易日收盘后</b></div>
          <div className="visual-score"><span>趋势分</span><strong>{Math.round((marketData.VOO.metrics.score + marketData.QQQ.metrics.score) / 2)}</strong><small>两只 ETF 平均状态</small></div>
        </div>
      </section>

      <section className="overview-funds">
        <div className="section-heading"><div><span className="micro-label">CHOOSE A DASHBOARD</span><h2>两只 ETF，两套独立趋势页</h2></div><p>VOO 更适合观察美国大盘的整体方向；QQQ 更集中于大型成长，通常波动更明显。</p></div>
        <div className="fund-grid"><FundCard symbol="VOO" /><FundCard symbol="QQQ" /></div>
      </section>

      <section className="compare-section">
        <div className="section-heading"><div><span className="micro-label">SIDE BY SIDE</span><h2>先看差异，再决定怎么搭配</h2></div><p>以下数据会随行情自动重算；费率来自发行方公开资料。</p></div>
        <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>比较项</th><th>VOO</th><th>QQQ</th><th>怎么理解</th></tr></thead><tbody>
          <tr><td>跟踪方向</td><td>S&P 500</td><td>Nasdaq-100</td><td>VOO 行业覆盖更广；QQQ 成长风格更集中</td></tr>
          <tr><td>基金年费率</td><td>{marketData.VOO.expenseRatio.toFixed(2)}%</td><td>{marketData.QQQ.expenseRatio.toFixed(2)}%</td><td>长期持有时，费率会持续从基金资产中扣除</td></tr>
          <tr><td>近一年收益</td><td>{fmtPercent(marketData.VOO.metrics.returns.year1)}</td><td>{fmtPercent(marketData.QQQ.metrics.returns.year1)}</td><td>只说明过去一年，不代表下一年</td></tr>
          <tr><td>20 日年化波动</td><td>{marketData.VOO.metrics.volatility20.toFixed(1)}%</td><td>{marketData.QQQ.metrics.volatility20.toFixed(1)}%</td><td>数值越高，近期日常涨跌通常越明显</td></tr>
          <tr><td>一年最大回撤</td><td>{marketData.VOO.metrics.maxDrawdown1y.toFixed(1)}%</td><td>{marketData.QQQ.metrics.maxDrawdown1y.toFixed(1)}%</td><td>帮助预估持有中途可能经历的心理压力</td></tr>
        </tbody></table></div>
      </section>

      <section className="principles-section" id="method">
        <div className="principle-intro"><span className="micro-label">DECISION BOUNDARY</span><h2>它提供方向，<br />但不替你押注。</h2><p>“趋势向上”不等于马上大涨，“超卖”也不等于已经到底。网页负责把数据讲清楚，你负责守住资金期限和仓位纪律。</p></div>
        <div className="principle-list">
          <article><BarChart3 size={20}/><div><h3>交叉验证，不看单一指标</h3><p>均线、RSI、收益、波动、回撤至少从三个角度相互核对。</p></div></article>
          <article><ShieldCheck size={20}/><div><h3>建议只到“动作强度”</h3><p>给出维持定投、拆小单、控制加仓等提示，不给保证收益或精确目标价。</p></div></article>
          <article><CircleAlert size={20}/><div><h3>-20% 是提醒档，不是抄底令</h3><p>深度回撤会被突出显示，但仍需确认备用金、期限和承受能力。</p></div></article>
        </div>
      </section>
      <footer className="site-footer"><div className="brand"><span className="brand-icon"><BarChart3 size={16} /></span><span><b>趋势雷达</b><small>ETF SIGNAL LAB</small></span></div><p>仅用于投资教育与趋势观察，不构成个性化投资建议。历史表现不保证未来结果。</p><span>数据：Nasdaq 日终行情</span></footer>
    </main>
  );
}
