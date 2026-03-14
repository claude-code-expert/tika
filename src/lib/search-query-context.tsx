'use client';

import { createContext, useContext } from 'react';

interface SearchQueryContextValue {
  searchQuery: string;
}

export const SearchQueryContext = createContext<SearchQueryContextValue>({
  searchQuery: '',
});

export const useSearchQuery = () => useContext(SearchQueryContext).searchQuery;
