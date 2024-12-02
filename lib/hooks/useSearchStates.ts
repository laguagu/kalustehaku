import { SearchResult } from "@/app/page";
import { parseAsString, useQueryStates } from "nuqs";
import { useState } from "react";

export function useSearchStates() {
  const [searchStates, setSearchStates] = useQueryStates({
    q: parseAsString.withDefault(""),
    cat: parseAsString.withDefault(""),
    mat: parseAsString.withDefault(""),
    col: parseAsString.withDefault(""),
    ai: parseAsString.withDefault(""),
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading,
  };
}
