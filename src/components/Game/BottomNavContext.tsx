import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface CTAState {
  canLockIn: boolean;
  isLocked: boolean;
  lockIn: () => void;
  label?: string;
  lockedLabel?: string;
}

interface BottomNavContextValue {
  /** When true, AnswerInput should hide its built-in button */
  externalCTA: boolean;
  ctaState: CTAState | null;
  setCTAState: (state: CTAState) => void;
}

const BottomNavContext = createContext<BottomNavContextValue | null>(null);

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [ctaState, setCtaStateRaw] = useState<CTAState | null>(null);
  const setCTAState = useCallback((state: CTAState) => setCtaStateRaw(state), []);

  return (
    <BottomNavContext.Provider value={{ externalCTA: true, ctaState, setCTAState }}>
      {children}
    </BottomNavContext.Provider>
  );
}

/** Used by AnswerInput to check if a bottom nav is managing the CTA */
export function useBottomNav() {
  return useContext(BottomNavContext);
}
