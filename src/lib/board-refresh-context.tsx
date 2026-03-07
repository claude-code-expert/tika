'use client';

import { createContext, useContext } from 'react';

interface BoardRefreshContextValue {
  register: (fn: () => Promise<void>) => void;
}

export const BoardRefreshContext = createContext<BoardRefreshContextValue>({
  register: () => {},
});

export const useBoardRefreshRegistry = () => useContext(BoardRefreshContext);
