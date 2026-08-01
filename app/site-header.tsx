import Link from "next/link";
import { Activity, ArrowUpRight } from "lucide-react";

export function SiteHeader({ active }: { active?: "VOO" | "QQQ" }) {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="趋势雷达首页">
        <span className="brand-icon"><Activity size={18} /></span>
        <span><b>趋势雷达</b><small>ETF SIGNAL LAB</small></span>
      </Link>
      <nav aria-label="ETF 页面">
        <Link className={active === "VOO" ? "active" : ""} href="/voo">VOO 分析</Link>
        <Link className={active === "QQQ" ? "active" : ""} href="/qqq">QQQ 分析</Link>
        <a href="#method">分析方法</a>
      </nav>
      <a className="nav-source" href="https://www.nasdaq.com/market-activity/etf" target="_blank" rel="noreferrer">
        数据来源 <ArrowUpRight size={14} />
      </a>
    </header>
  );
}
