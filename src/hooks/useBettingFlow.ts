import { useState, useCallback } from 'react';

export interface PlacedBet {
  id: string;
  eventName: string;
  stake: number;
  odds: number;
  status: 'pending' | 'settled' | 'won' | 'lost';
  payout?: number;
}

export function useBettingFlow() {
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [liveBets, setLiveBets] = useState<PlacedBet[]>([]);
  const [settlement, setSettlement] = useState<{ id: string; won: boolean; payout: number } | null>(null);
  const [balance, setBalance] = useState(1000); // Starting balance

  const placeBet = useCallback((eventName: string, stake: number, odds: number) => {
    // Optimistic UI: show bet immediately
    const newBet: PlacedBet = {
      id: `bet-${Date.now()}`,
      eventName,
      stake,
      odds,
      status: 'pending',
    };

    setBalance((prev) => prev - stake);
    setLiveBets((prev) => [newBet, ...prev]);

    // Simulate backend confirmation (replace with real API call)
    setTimeout(() => {
      console.log('Bet confirmed:', newBet);
    }, 500);

    return newBet.id;
  }, []);

  const settleBet = useCallback((betId: string, won: boolean, payout: number) => {
    setLiveBets((prev) => prev.filter((b) => b.id !== betId));
    setSettlement({ id: betId, won, payout });

    if (won) {
      setBalance((prev) => prev + payout);
    }

    // Auto-clear settlement after 3s
    setTimeout(() => setSettlement(null), 3000);
  }, []);

  const removeBet = useCallback((betId: string) => {
    const bet = liveBets.find((b) => b.id === betId);
    if (bet) {
      setBalance((prev) => prev + bet.stake);
      setLiveBets((prev) => prev.filter((b) => b.id !== betId));
    }
  }, [liveBets]);

  return {
    balance,
    liveBets,
    settlement,
    placeBet,
    settleBet,
    removeBet,
  };
}
