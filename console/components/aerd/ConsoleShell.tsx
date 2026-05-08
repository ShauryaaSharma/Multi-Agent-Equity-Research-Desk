'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useLiveTape } from '@/hooks/useLiveTape';
import { useTapeStore } from '@/store/tapeStore';
import { useServiceHealth } from '@/hooks/useServiceHealth';
import { fmtPct, fmtPrice } from '@/lib/aerd/format';
import { TapeStrip } from './TapeStrip';
import { SkinDock } from './SkinDock';

const NAV = [
  { section: 'Intelligence', items: [
    { href: '/dashboard', icon: '⬛', label: 'Dashboard' },
    { href: '/dashboard/markets', icon: '📈', label: 'Markets' },
    { href: '/dashboard/news', icon: '📰', label: 'News Intelligence' },
    { href: '/dashboard/agents', icon: '🤖', label: 'Agent Insights' },
    { href: '/dashboard/shock', icon: '⚡', label: 'Shock Predictor', badge: true },
  ]},
  { section: 'Analysis', items: [
    { href: '/dashboard/scanner', icon: '🔍', label: 'Screener' },
    { href: '/dashboard/backtest', icon: '🧪', label: 'Backtesting' },
    { href: '/dashboard/options', icon: '⛓️', label: 'Options Chain' },
  ]},
  { section: 'Account', items: [
    { href: '/dashboard/portfolio', icon: '💼', label: 'Portfolio' },
    { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
    { href: '/settings', icon: '🔧', label: 'Broker & API' },
    { href: '/', icon: '🏠', label: '← Home' },
  ]},
];

function marketStatusLabel(status: string) {
  if (status === 'OPEN') return { text: 'Market Open · IST', cls: 'mkt-pill' };
  if (status === 'PRE_MARKET') return { text: 'Pre-Market', cls: 'mkt-pill' };
  if (status === 'AFTER_HOURS') return { text: 'After Hours', cls: 'mkt-pill' };
  return { text: 'Market Closed', cls: 'mkt-pill' };
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  useLiveTape();
  const indices = useTapeStore((s) => s.indices);
  const marketStatus = useTapeStore((s) => s.marketStatus);
  const { isConnected, isLoading } = useServiceHealth();
  const mkt = marketStatusLabel(marketStatus);

  return (
    <>
      <SkinDock />
      <div className="dash-layout">
        <aside className={`sidebar ${collapsed ? 'coll' : ''}`}>
          <div className="sb-head">
            <div className="sb-logo-icon">F</div>
            <div className="sb-brand">AERD</div>
            <button type="button" className="sb-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              {collapsed ? '▶' : '◀'}
            </button>
          </div>
          <nav className="sb-nav">
            {NAV.map((group) => (
              <div key={group.section}>
                <div className="sb-sec-lbl">{group.section}</div>
                {group.items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sb-item ${active ? 'act' : ''}`}
                    >
                      <span className="sb-icon">{item.icon}</span>
                      <span className="sb-lbl">{item.label}</span>
                      {item.badge && <span className="sb-badge">!</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="dash-main">
          <header className="topbar">
            <div className="tb-search">
              <span style={{ color: 'var(--text-4)', fontSize: 13 }}>🔍</span>
              <input type="text" placeholder="Search stocks, news, indices…" />
            </div>
            <div className={mkt.cls}>
              <div className="ldot" />
              {mkt.text}
            </div>
            {!isLoading && (
              <span className="badge" style={{ background: isConnected ? 'var(--green-soft)' : 'var(--red-soft)', color: isConnected ? 'var(--green)' : 'var(--red)' }}>
                {isConnected ? 'API live' : 'API offline'}
              </span>
            )}
            {indices.slice(0, 4).map((idx) => {
              const up = idx.changePercent >= 0;
              return (
                <div key={idx.symbol} className="tb-ticker">
                  <span className="tb-sym">{idx.symbol}</span>
                  <span className="tb-price">{fmtPrice(idx.price)}</span>
                  <span className={`tb-chg ${up ? 'up' : 'dn'}`}>{up ? '▲' : '▼'}{fmtPct(idx.changePercent)}</span>
                </div>
              );
            })}
            <div className="tb-actions">
              <div className="tbtn">🔔<div className="nbadge">3</div></div>
              <Link href="/settings" className="tb-av" style={{ textDecoration: 'none' }}>AK</Link>
            </div>
          </header>

          <div className="dash-content">{children}</div>
          <TapeStrip />
        </div>
      </div>
    </>
  );
}
