import { useState } from 'react';

export type BetSide = 'for' | 'against';

interface UseBetInputOptions {
  userBalance: number;
  onBetFor: (amount: number) => void;
  onBetAgainst: (amount: number) => void;
}

export function useBetInput({ userBalance, onBetFor, onBetAgainst }: UseBetInputOptions) {
  const [selectedSide, setSelectedSide] = useState<BetSide | null>(null);
  const [inputAmount, setInputAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectSide = (side: BetSide) => {
    if (selectedSide === side) {
      // toggle — uždaryti jei tas pats mygtukas paspaustas pakartotinai
      setSelectedSide(null);
      setInputAmount('');
      setError(null);
    } else {
      setSelectedSide(side);
      setInputAmount('');
      setError(null);
    }
  };

  const handleAmountChange = (text: string) => {
    // leisti įvesti tik skaičius
    const numeric = text.replace(/[^0-9]/g, '');
    setInputAmount(numeric);
    if (error) setError(null);
  };

  const confirm = (): boolean => {
    const amount = parseInt(inputAmount, 10);

    if (!inputAmount || isNaN(amount) || amount <= 0) {
      setError('Įveskite teisingą taškų sumą');
      return false;
    }

    if (amount > userBalance) {
      setError('Nepakanka taškų');
      return false;
    }

    if (selectedSide === 'for') {
      onBetFor(amount);
    } else if (selectedSide === 'against') {
      onBetAgainst(amount);
    }

    setSelectedSide(null);
    setInputAmount('');
    setError(null);
    return true;
  };

  const reset = () => {
    setSelectedSide(null);
    setInputAmount('');
    setError(null);
  };

  return {
    selectedSide,
    inputAmount,
    error,
    selectSide,
    handleAmountChange,
    confirm,
    reset,
  };
}
