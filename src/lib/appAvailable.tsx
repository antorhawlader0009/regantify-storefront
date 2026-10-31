'use client';

import { createContext, useContext, type ReactNode } from 'react';

/** Whether the Regantify app can be downloaded right now (the store layout asks the server). Footers and the install banner read it. */
const Ctx = createContext(false);

export function AppAvailableProvider({ available, children }: { available: boolean; children: ReactNode }) {
  return <Ctx.Provider value={available}>{children}</Ctx.Provider>;
}

export function useAppAvailable(): boolean {
  return useContext(Ctx);
}
