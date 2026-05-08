'use client';

import { useLiveTape } from '@/hooks/useLiveTape';
import { useTapeStore } from '@/store/tapeStore';
import { fmtPct, fmtPrice } from '@/lib/aerd/format';

export function TapeStrip() {
  useLiveTape();
  const indices = useTapeStore((s) => s.indices);
  const items = [...indices, ...indices];

  return (
    <div className="ticker-strip">
      <div className="ticker-track">
        {items.map((t, i) => {
          const up = t.changePercent >= 0;
          return (
            <div key={`${t.symbol}-${i}`} className="tick-item">
              <span className="tick-sym">{t.symbol}</span>
              <span className="tick-p">{fmtPrice(t.price)}</span>
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono', color: up ? 'var(--green)' : 'var(--red)' }}>
                {up ? '▲' : '▼'} {fmtPct(t.changePercent)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
