import React, { createContext, useContext, useMemo, useState } from 'react';
import TripiPopup from './TripiPopup';
import { useTripiVoice } from './useTripiVoice';

export type TripiContextValue = {
  show: () => void;
  hide: () => void;
};

const TripiContext = createContext<TripiContextValue | undefined>(undefined);

export function TripiProvider({ children }: { children: React.ReactNode }) {
  const [manualVisible, setManualVisible] = useState(false);
  const { isActive, statusText, activate, deactivate } = useTripiVoice(true, true);
  const visible = isActive || manualVisible;

  const value = useMemo(() => ({
    show: async () => { setManualVisible(true); try { await activate(); } catch {} },
    hide: () => setManualVisible(false)
  }), []);

  return (
    <TripiContext.Provider value={value}>
      {children}
      <TripiPopup visible={visible} statusText={statusText} onClose={() => { setManualVisible(false); deactivate(); }} />
    </TripiContext.Provider>
  );
}

export function useTripi() {
  const ctx = useContext(TripiContext);
  if (!ctx) throw new Error('useTripi must be used within TripiProvider');
  return ctx;
}
