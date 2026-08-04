import { create } from 'zustand';

export interface SwarmInsight {
  id: string;
  agentName: 'News Scout' | 'Risk' | 'Macro' | 'Technical' | 'Market Reaction' | 'Decision';
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  explanation: string;
  timestamp: Date;
  metrics?: Record<string, number | null>;
}

interface AgentState {
  insights: SwarmInsight[];
  addInsight: (insight: SwarmInsight) => void;
  updateInsight: (id: string, data: Partial<SwarmInsight>) => void;
  clearInsights: () => void;
  setInsights: (insights: SwarmInsight[]) => void;
}

export const useSwarmStore = create<AgentState>((set) => ({
  insights: [],
  addInsight: (insight) =>
    set((state) => ({ insights: [insight, ...state.insights] })),
  updateInsight: (id, data) =>
    set((state) => ({
      insights: state.insights.map((insight) =>
        insight.id === id ? { ...insight, ...data } : insight
      ),
    })),
  clearInsights: () => set({ insights: [] }),
  setInsights: (insights) => set({ insights }),
}));
