import { useState, useCallback } from 'react';

export interface PlacedBet {
  id: string;
  eventName: string;
  eventId: string;
  stake: number;
  odds: number;
  status: 'pending' | 'settled' | 'won' | 'lost';
  payout?: number;
  timestamp: number;
}

// Validation constants
export const BETTING_CONSTRAINTS = {
  MIN_STAKE: 1,
  MAX_STAKE: 1000,
  MAX_BETS_PER_RACE: 3,
  STARTING_BALANCE: 1000,
} as const;

export interface BettingFlowError {
  type: 'MIN_STAKE' | 'MAX_STAKE' | 'INSUFFICIENT_BALANCE' | 'MAX_BETS_EXCEEDED' | 'INVALID_AMOUNT';
  message: string;
}

export function useBettingFlow() {
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [liveBets, setLiveBets] = useState<PlacedBet[]>([]);
  const [settlement, setSettlement] = useState<{ id: string; won: boolean; payout: number } | null>(null);
  const [balance, setBalance] = useState(BETTING_CONSTRAINTS.STARTING_BALANCE);
  const [lastError, setLastError] = useState<BettingFlowError | null>(null);

  const validateBet = useCallback((stake: number, eventId: string, currentBalance: number): BettingFlowError | null => {
    // Validate amount
    if (!stake || isNaN(stake)) {
      return { type: 'INVALID_AMOUNT', message: 'Invalid bet amount' };
    }

    // Validate minimum stake
    if (stake < BETTING_CONSTRAINTS.MIN_STAKE) {
      return {
        type: 'MIN_STAKE',
        message: `Minimum stake is $${BETTING_CONSTRAINTS.MIN_STAKE}`,
      };
    }

    // Validate maximum stake
    if (stake > BETTING_CONSTRAINTS.MAX_STAKE) {
      return {
        type: 'MAX_STAKE',
        message: `Maximum stake is $${BETTING_CONSTRAINTS.MAX_STAKE}`,
      };
    }

    // Validate sufficient balance
    if (stake > currentBalance) {
      return {
        type: 'INSUFFICIENT_BALANCE',
        message: `Insufficient balance. Available: $${currentBalance.toFixed(2)}`,
      };
    }

    // Validate max bets per race
    const betsForRace = liveBets.filter((b) => b.eventId === eventId).length;
    if (betsForRace >= BETTING_CONSTRAINTS.MAX_BETS_PER_RACE) {
      return {
        type: 'MAX_BETS_EXCEEDED',
        message: `Maximum ${BETTING_CONSTRAINTS.MAX_BETS_PER_RACE} bets per race`,
      };
    }

    return null;
  }, [liveBets]);

  const placeBet = useCallback(
    (eventName: string, stake: number, odds: number, eventId: string = `event-${Date.now()}`) => {
      const error = validateBet(stake, eventId, balance);
      if (error) {
        setLastError(error);
        return null;
      }

      // Clear previous error
      setLastError(null);

      // Create new bet
      const newBet: PlacedBet = {
        id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventName,
        eventId,
        stake,
        odds,
        status: 'pending',
        timestamp: Date.now(),
      };

      // Update balance and add to live bets
      setBalance((prev) => prev - stake);
      setLiveBets((prev) => [newBet, ...prev]);

      // Simulate backend confirmation
      setTimeout(() => {
        console.log('Bet confirmed:', newBet);
      }, 500);

      return newBet.id;
    },
    [balance, validateBet]
  );

  const settleBet = useCallback((betId: string, won: boolean, payout: number) => {
    setLiveBets((prev) => prev.filter((b) => b.id !== betId));
    setSettlement({ id: betId, won, payout });

    if (won) {
      setBalance((prev) => prev + payout);
    }

    // Auto-clear settlement after 3s
    setTimeout(() => setSettlement(null), 3000);
  }, []);

  const removeBet = useCallback(
    (betId: string) => {
      const bet = liveBets.find((b) => b.id === betId);
      if (bet) {
        setBalance((prev) => prev + bet.stake);
        setLiveBets((prev) => prev.filter((b) => b.id !== betId));
        setLastError(null);
      }
    },
    [liveBets]
  );

  const clearSlip = useCallback(() => {
    setLiveBets([]);
    setSettlement(null);
    setLastError(null);
  }, []);

  return {
    balance,
    liveBets,
    settlement,
    lastError,
    placeBet,
    settleBet,
    removeBet,
    clearSlip,
    validateBet,
  };
}
