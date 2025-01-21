import { parseAsString, useQueryStates } from "nuqs";
import { useState, useTransition } from "react";
import { SupabaseProduct } from "../types/search/types";

export function useSearchStates() {
  const [searchStates, setSearchStates] = useQueryStates({
    q: parseAsString.withDefault(""),
    cat: parseAsString.withDefault(""),
    mat: parseAsString.withDefault(""),
    col: parseAsString.withDefault(""),
    ai: parseAsString.withDefault(""),
  });

  const [results, setResults] = useState<SupabaseProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, startSearch] = useTransition();

  return {
    searchStates,
    setSearchStates,
    results,
    setResults,
    error,
    setError,
    hasSearched,
    setHasSearched,
    isLoading,
    startSearch,
  };
}
