import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SelectedBet {
  eventId: string;
  eventName: string;
  odds: number;
}

interface BettingContextType {
  selectedBet: SelectedBet | null;
  currentOdds: number;
  userBalance: number;
  placeBetLoading: boolean;
  selectOption: (bet: SelectedBet) => void;
  updateStake: (stake: number) => void;
  clearSlip: () => void;
  setPlaceBetLoading: (loading: boolean) => void;
  updateBalance: (amount: number) => void;
  updateOdds: (odds: number) => void;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export function BettingProvider({ children }: { children: ReactNode }) {
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [currentOdds, setCurrentOdds] = useState<number>(1.5);
  const [userBalance, setUserBalance] = useState<number>(1000);
  const [placeBetLoading, setPlaceBetLoading] = useState<boolean>(false);

  const selectOption = (bet: SelectedBet) => {
    setSelectedBet(bet);
  };

  const updateStake = (stake: number) => {
    // Validation handled by consumers
    if (selectedBet) {
      setSelectedBet({ ...selectedBet });
    }
  };

  const clearSlip = () => {
    setSelectedBet(null);
  };

  const updateBalance = (amount: number) => {
    setUserBalance((prev) => Math.max(0, prev + amount));
  };

  const updateOdds = (odds: number) => {
    setCurrentOdds(odds);
  };

  const value: BettingContextType = {
    selectedBet,
    currentOdds,
    userBalance,
    placeBetLoading,
    selectOption,
    updateStake,
    clearSlip,
    setPlaceBetLoading,
    updateBalance,
    updateOdds,
  };

  return (
    <BettingContext.Provider value={value}>
      {children}
    </BettingContext.Provider>
  );
}

export function useBettingContext() {
  const context = useContext(BettingContext);
  if (!context) {
    throw new Error('useBettingContext must be used within BettingProvider');
  }
  return context;
}
