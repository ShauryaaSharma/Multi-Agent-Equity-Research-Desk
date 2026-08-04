'use client';

import { useWireFeed } from '@/hooks/useWireFeed';
import { WireRows } from '@/components/aerd/WireRows';

export default function NewsPage() {
  const { news, isLoading } = useWireFeed();

  return (
    <div>
      <div className="pg-head">
        <div className="pg-title">News Intelligence</div>
        <div className="pg-sub">NewsAPI + Alpha Vantage feed · /api/fetch-news/</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <span className="badge badge-bl">{news.length} articles loaded</span>
      </div>
      <div className="card">
        {isLoading ? <p className="cb" style={{ color: 'var(--text-3)' }}>Loading news…</p> : <WireRows items={news} />}
      </div>
    </div>
  );
}
