'use client';

import { useEffect, useRef } from 'react';
import { WebSocketClient } from '@/lib/socketClient';
import { useTapeStore } from '@/store/tapeStore';

export function useTapeStream() {
  const wsRef = useRef<WebSocketClient | null>(null);
  const updateIndex = useTapeStore((state) => state.updateIndex);

  useEffect(() => {
    wsRef.current = new WebSocketClient('/ws/market/ticker/');

    wsRef.current.connect((data) => {
      if (data.type === 'price_update') {
        updateIndex(data.symbol, {
          price: data.price,
          change: data.change,
          changePercent: data.changePercent,
        });
      }
    });

    return () => {
      wsRef.current?.disconnect();
    };
  }, [updateIndex]);

  return wsRef.current;
}
