"use client";

import { useMemo, useState } from "react";

type StyleKey = "steady" | "balanced" | "growth";

const MODES = {
  steady: {
    name: "更稳一点",
    note: "分 10 个月，给波动留足空间",
    months: 10,
    reserve: 30,
    voo: 80,
    qqq: 20,
  },
  balanced: {
    name: "均衡",
    note: "分 6 个月，兼顾入场与回撤",
    months: 6,
    reserve: 20,
    voo: 70,
    qqq: 30,
  },
  growth: {
    name: "偏成长",
    note: "分 4 个月，波动会更明显",
    months: 4,
    reserve: 10,
    voo: 50,
    qqq: 50,
  },
} as const;

const money = (value: number) =>
  new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value));

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m4 10 3.5 3.5L16 5.5" />
    </svg>
  );
}

function TrendChart({ drawdown }: { drawdown: number }) {
  const series = [72, 77, 75, 82, 86, 84, 91, 88, 95, 92, 100];
  const current = Math.max(62, 100 - drawdown);
  const points = [...series, current]
    .map((value, index) => {
      const x = 26 + (index / series.length) * 528;
      const y = 198 - ((value - 60) / 42) * 156;
      return `${x},${y}`;
    })
    .join(" ");
  const markerY = 198 - ((current - 60) / 42) * 156;

  return (
    <div className="chart-wrap" aria-label={`回撤策略示意图，当前输入回撤 ${drawdown}%`}>
      <div className="chart-head">
        <div>
          <span className="eyebrow">策略示意 · 非实时行情</span>
          <strong>距离阶段高点</strong>
        </div>
        <div className="drawdown-number">-{drawdown}%</div>
      </div>
      <svg viewBox="0 0 580 230" role="img">
        <defs>
          <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#32d4c8" />
            <stop offset="1" stopColor="#d5f45f" />
          </linearGradient>
          <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#32d4c8" stopOpacity=".23" />
            <stop offset="1" stopColor="#32d4c8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[10, 20, 30].map((level) => {
          const y = 198 - ((100 - level - 60) / 42) * 156;
          return (
            <g key={level}>
              <line className="trigger-line" x1="26" x2="554" y1={y} y2={y} />
              <text className="trigger-label" x="548" y={y - 6} textAnchor="end">
                -{level}%
              </text>
            </g>
          );
        })}
        <polygon points={`26,205 ${points} 554,205`} fill="url(#areaGlow)" />
        <polyline points={points} fill="none" stroke="url(#lineGlow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="554" cy={markerY} r="7" fill="#d5f45f" stroke="#0c1518" strokeWidth="4" />
        <text className="axis-copy" x="26" y="222">过去</text>
        <text className="axis-copy" x="554" y="222" textAnchor="end">你的输入</text>
      </svg>
    </div>
  );
}

export function StrategyDashboard() {
  const [amount, setAmount] = useState(10000);
  const [drawdown, setDrawdown] = useState(8);
  const [style, setStyle] = useState<StyleKey>("balanced");
  const [emergencyReady, setEmergencyReady] = useState(true);
  const [noticeOn, setNoticeOn] = useState(true);
  const [fxCost, setFxCost] = useState(0.35);
  const [tradeCost, setTradeCost] = useState(0.1);
  const [fixedCost, setFixedCost] = useState(0);
  const [toast, setToast] = useState(false);

  const plan = useMemo(() => {
    const mode = MODES[style];
    const regularPool = amount * (1 - mode.reserve / 100);
    const monthly = regularPool / mode.months;
    const reservePool = amount - regularPool;
    const reserveSlice = reservePool / 3;
    const triggered = drawdown >= 30 ? 3 : drawdown >= 20 ? 2 : drawdown >= 10 ? 1 : 0;
    const extraNow = reserveSlice * triggered;
    const action =
      drawdown >= 30
        ? "定投 + 第三档加仓"
        : drawdown >= 20
          ? "定投 + 第二档加仓"
          : drawdown >= 10
            ? "定投 + 第一档加仓"
            : "只做本期定投";
    const qqqRisk = mode.qqq >= 50 ? "较高" : mode.qqq >= 30 ? "中等" : "较低";
    const fundFeeRate = (mode.voo * 0.03 + mode.qqq * 0.2) / 100;
    const firstYearCost = amount * ((fxCost + tradeCost + fundFeeRate) / 100) + fixedCost;

    return {
      ...mode,
      regularPool,
      monthly,
      reservePool,
      reserveSlice,
      triggered,
      extraNow,
      action,
      qqqRisk,
      fundFeeRate,
      firstYearCost,
      netAmount: amount - firstYearCost,
    };
  }, [amount, drawdown, style, fxCost, tradeCost, fixedCost]);

  const requestNotice = async () => {
    setNoticeOn(true);
    setToast(true);
    window.setTimeout(() => setToast(false), 3400);
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="买入罗盘首页">
          <span className="brand-mark"><i /></span>
          <span>买入罗盘</span>
        </a>
        <nav aria-label="主导航">
          <a href="#plan">买入计划</a>
          <a href="#cost">成本体检</a>
          <a href="#learn">新手说明</a>
        </nav>
        <a className="source-link" href="#sources">依据与边界 <ArrowIcon /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="status-pill"><span /> 为长期 ETF 新手设计</div>
          <h1>今天该买多少，<br /><em>一眼看懂。</em></h1>
          <p>不猜顶，不抄底。把你的资金和回撤输入进去，得到一份“定投为主、下跌分档加仓”的执行清单。</p>
          <div className="hero-proof">
            <span><CheckIcon /> 先留生活备用金</span>
            <span><CheckIcon /> 不加杠杆</span>
            <span><CheckIcon /> 费用算在内</span>
          </div>
        </div>

        <div className="signal-card">
          <div className="signal-topline">
            <span>今天的动作</span>
            <span className={`risk-dot risk-${plan.triggered}`}>{plan.triggered === 0 ? "常规定投" : `回撤第 ${plan.triggered} 档`}</span>
          </div>
          <strong className="signal-action">{emergencyReady ? plan.action : "先补足备用金"}</strong>
          <p>{emergencyReady ? `本期基础投入 ${money(plan.monthly)}${plan.extraNow ? `，回撤加仓 ${money(plan.extraNow)}` : "，暂不动用回撤预备金"}。` : "投资的钱必须是未来 3—5 年用不到的钱。没有备用金，先不买。"}</p>
          <div className="signal-grid">
            <div><span>计划总额</span><b>{money(amount)}</b></div>
            <div><span>执行期</span><b>{plan.months} 个月</b></div>
            <div><span>VOO / QQQ</span><b>{plan.voo} / {plan.qqq}</b></div>
          </div>
          <a className="primary-button" href="#plan">生成我的清单 <ArrowIcon /></a>
        </div>
      </section>

      <section className="planner section-shell" id="plan">
        <div className="section-title">
          <div>
            <span className="section-kicker">01 · 生成计划</span>
            <h2>三个输入，换成一张行动卡</h2>
          </div>
          <p>这里的结果是教育用途的规则样例，不是收益预测。你可以随时调整，不需要懂技术指标。</p>
        </div>

        <div className="planner-grid">
          <form className="control-panel" onSubmit={(event) => event.preventDefault()}>
            <label className="field-label" htmlFor="amount">这次一共准备投入</label>
            <div className="money-input"><span>¥</span><input id="amount" type="number" min="100" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value) || 0)} /></div>
            <div className="quick-amounts" aria-label="快速选择金额">
              {[5000, 10000, 30000].map((item) => <button key={item} type="button" className={amount === item ? "active" : ""} onClick={() => setAmount(item)}>¥{item / 10000 >= 1 ? `${item / 10000}万` : item}</button>)}
            </div>

            <label className="field-label" htmlFor="drawdown">当前比阶段高点低多少</label>
            <div className="range-copy"><span>0%</span><strong>-{drawdown}%</strong><span>-35%</span></div>
            <input className="range" id="drawdown" type="range" min="0" max="35" value={drawdown} onChange={(event) => setDrawdown(Number(event.target.value))} />
            <p className="field-help">不知道？可在行情页看“52 周最高价”，按（最高价－现价）÷最高价计算。</p>

            <fieldset>
              <legend className="field-label">你更在意什么</legend>
              <div className="mode-options">
                {(Object.keys(MODES) as StyleKey[]).map((key) => (
                  <button key={key} type="button" className={style === key ? "active" : ""} onClick={() => setStyle(key)}>
                    <b>{MODES[key].name}</b><span>{MODES[key].note}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="switch-row">
              <span><b>生活备用金已留好</b><small>至少覆盖 3—6 个月必要开支</small></span>
              <input type="checkbox" checked={emergencyReady} onChange={(event) => setEmergencyReady(event.target.checked)} />
              <i aria-hidden="true" />
            </label>
          </form>

          <div className="result-panel">
            <TrendChart drawdown={drawdown} />
            <div className="action-list">
              <div className="action-head">
                <div><span className="eyebrow">你的执行清单</span><h3>{emergencyReady ? plan.action : "暂缓投入"}</h3></div>
                <span className="plan-badge">{plan.name}</span>
              </div>
              {!emergencyReady ? (
                <div className="stop-card"><b>先做第 0 步</b><p>把短期学费、生活费和旅行预算单独放好。投资账户只放长期不用的钱。</p></div>
              ) : (
                <ol>
                  <li><span>01</span><div><b>每月固定买</b><p>连续 {plan.months} 个月，每月约 {money(plan.monthly)}。不因为新闻停掉。</p></div></li>
                  <li className={drawdown >= 10 ? "is-live" : ""}><span>02</span><div><b>跌到 -10%</b><p>加一份 {money(plan.reserveSlice)}；没到就继续等。</p></div></li>
                  <li className={drawdown >= 20 ? "is-live" : ""}><span>03</span><div><b>跌到 -20%</b><p>再加一份 {money(plan.reserveSlice)}，仍然不一次押满。</p></div></li>
                  <li className={drawdown >= 30 ? "is-live" : ""}><span>04</span><div><b>跌到 -30%</b><p>投入最后一份 {money(plan.reserveSlice)}；随后回到常规定投。</p></div></li>
                </ol>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="allocation-band">
        <div className="section-shell allocation-grid">
          <div className="allocation-copy">
            <span className="section-kicker">02 · 看懂组合</span>
            <h2>先要“广”，再谈“快”</h2>
            <p>VOO 更像地基，覆盖美国大型公司；QQQ 更偏大型成长与科技，波动通常更明显。两个都买不等于完全分散，它们的持仓有重叠。</p>
            <div className="allocation-bar" aria-label={`示例配置 VOO ${plan.voo}%，QQQ ${plan.qqq}%`}>
              <span style={{ width: `${plan.voo}%` }}>VOO {plan.voo}%</span>
              <span style={{ width: `${plan.qqq}%` }}>QQQ {plan.qqq}%</span>
            </div>
          </div>
          <div className="compare-cards">
            <article><div className="ticker">VOO</div><span>核心仓示例</span><h3>标普 500</h3><p>行业更广，适合做长期组合的主体。</p><footer><b>0.03%</b> 官方年费率</footer></article>
            <article><div className="ticker accent">QQQ</div><span>成长仓示例</span><h3>纳斯达克 100</h3><p>成长风格更集中，涨跌感受会更强。</p><footer><b>0.20%</b> 官方总费率</footer></article>
          </div>
        </div>
      </section>

      <section className="cost-section section-shell" id="cost">
        <div className="section-title">
          <div><span className="section-kicker">03 · 成本体检</span><h2>“零佣金”不等于零损耗</h2></div>
          <p>评论区最关心“要不要付费”。真正要看的是全链路：换汇、汇款、交易、价差、基金费率。</p>
        </div>
        <div className="cost-grid">
          <div className="cost-controls">
            <label><span>换汇价差 <small>银行报价与市场中间价的差</small></span><div><input type="number" min="0" step="0.05" value={fxCost} onChange={(event) => setFxCost(Number(event.target.value) || 0)} /><i>%</i></div></label>
            <label><span>交易与平台成本 <small>佣金、平台费等合计估算</small></span><div><input type="number" min="0" step="0.05" value={tradeCost} onChange={(event) => setTradeCost(Number(event.target.value) || 0)} /><i>%</i></div></label>
            <label><span>固定汇款成本 <small>中转行、汇出行或入账费用</small></span><div><i>¥</i><input type="number" min="0" step="10" value={fixedCost} onChange={(event) => setFixedCost(Number(event.target.value) || 0)} /></div></label>
            <p>基金年费率按当前示例组合估算：{plan.fundFeeRate.toFixed(3)}%。买卖价差和税务因账户、市场与时点不同，未自动计入。</p>
          </div>
          <div className="cost-result">
            <span>首年可见成本估算</span>
            <strong>{money(plan.firstYearCost)}</strong>
            <p>约占投入金额 <b>{amount ? ((plan.firstYearCost / amount) * 100).toFixed(2) : "0.00"}%</b></p>
            <div className="cost-meter"><i style={{ width: `${Math.min(100, amount ? (plan.firstYearCost / amount) * 2000 : 0)}%` }} /></div>
            <ul>
              <li><span>预计真正进入组合</span><b>{money(plan.netAmount)}</b></li>
              <li><span>最该先压低</span><b>{fixedCost > amount * fxCost / 100 ? "固定汇款费" : "换汇价差"}</b></li>
              <li><span>小额定投提示</span><b>少汇几次，账户内分批买</b></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="alert-section section-shell">
        <div className="alert-card">
          <div className="alert-icon">20</div>
          <div><span className="section-kicker">回撤提醒</span><h2>跌破 -20%，再提醒我看一眼</h2><p>提醒只是执行既定计划，不代表“已经到底”。本网页关闭后不会后台盯盘；接入实时行情服务后才能持续监控。</p></div>
          <button type="button" className={noticeOn ? "notice-on" : ""} onClick={noticeOn ? () => setNoticeOn(false) : requestNotice}>{noticeOn ? "提醒已加入计划" : "加入提醒"}<CheckIcon /></button>
        </div>
      </section>

      <section className="learn-section section-shell" id="learn">
        <div className="section-title">
          <div><span className="section-kicker">04 · 新手说明</span><h2>下单前，只记住四句话</h2></div>
        </div>
        <div className="rule-grid">
          <article><span>01</span><h3>先有备用金</h3><p>未来 3—5 年可能要用的钱，不进入股票账户。</p></article>
          <article><span>02</span><h3>按金额定投</h3><p>固定金额、固定周期，价格低时自然买得更多。</p></article>
          <article><span>03</span><h3>分档，不梭哈</h3><p>-10%、-20%、-30% 是纪律线，不是底部预测。</p></article>
          <article><span>04</span><h3>一年复盘一次</h3><p>检查目标、费用与配比，不被每日涨跌牵着走。</p></article>
        </div>
        <div className="dont-do">
          <b>这个网站不会做的事</b>
          <span>× 承诺收益</span><span>× 伪造 AI 胜率</span><span>× 鼓励杠杆</span><span>× 把娱乐视频当实盘证明</span>
        </div>
      </section>

      <section className="sources section-shell" id="sources">
        <div>
          <span className="section-kicker">内容依据</span>
          <h2>视频给了界面灵感，规则要经得起核对</h2>
        </div>
        <div className="source-list">
          <a href="https://v.douyin.com/Le9LfoIH9-U/" target="_blank" rel="noreferrer"><span>01</span><b>抖音视频与公开评论</b><small>趋势、入场、风险面板与策略引擎的界面灵感；原视频标注“虚构演绎，仅供娱乐”。</small><ArrowIcon /></a>
          <a href="https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging" target="_blank" rel="noreferrer"><span>02</span><b>Investor.gov：定期定额</b><small>固定金额、固定间隔买入的基础定义。</small><ArrowIcon /></a>
          <a href="https://www.finra.org/investors/investing/investing-basics/asset-allocation-diversification" target="_blank" rel="noreferrer"><span>03</span><b>FINRA：分散与资产配置</b><small>用配置与再平衡管理集中风险。</small><ArrowIcon /></a>
          <a href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/mutual-fund-and-etf-fees-and-expenses-investor-bulletin" target="_blank" rel="noreferrer"><span>04</span><b>Investor.gov：ETF 费用</b><small>佣金、基金费率、买卖价差与其他隐性成本。</small><ArrowIcon /></a>
        </div>
      </section>

      <footer className="footer">
        <div className="brand"><span className="brand-mark"><i /></span><span>买入罗盘</span></div>
        <p>教育工具，不构成个性化投资、法律或税务建议。投资有风险，可能损失本金。</p>
        <span>Made for a calmer decision.</span>
      </footer>

      {toast && <div className="toast" role="status"><CheckIcon /><div><b>已加入你的 -20% 计划</b><span>这是浏览器提醒预览；持续监控仍需实时行情服务。</span></div></div>}
    </main>
  );
}
