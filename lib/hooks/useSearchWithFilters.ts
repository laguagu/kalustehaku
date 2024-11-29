import { searchFurniture } from "@/app/actions";
import { SearchResult } from "@/app/page";
import { parseAsString, useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { COLOR_GROUPS_MAP } from "../types/filters/colorGroups";
import {
  FurnitureMainCategoryEnum,
  FurnitureMaterialEnum,
  ProductMetadata,
} from "../types/metadata/metadata";

export function useSearchWithFilters() {
  const [searchStates, setSearchStates] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      cat: parseAsString.withDefault(""),
      mat: parseAsString.withDefault(""),
      col: parseAsString.withDefault(""),
    },
    {
      history: "replace",
      shallow: false,
    },
  );

  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const expandColorGroups = (colorGroups: string[]): string[] => {
    return colorGroups.flatMap(
      (group) => COLOR_GROUPS_MAP[group as keyof typeof COLOR_GROUPS_MAP] || [],
    );
  };

  const buildFilters = useCallback(() => {
    const filters: Partial<ProductMetadata> = {};

    if (searchStates.cat && searchStates.cat !== "all") {
      filters.mainGategory = searchStates.cat as FurnitureMainCategoryEnum;
    }

    if (searchStates.mat) {
      const materialsList = searchStates.mat.split(",").filter(Boolean);
      if (materialsList.length > 0) {
        filters.materials = materialsList as FurnitureMaterialEnum[];
      }
    }

    if (searchStates.col) {
      const selectedColorGroups = searchStates.col.split(",").filter(Boolean);
      if (selectedColorGroups.length > 0) {
        // Muunnetaan väriryhmät yksittäisiksi väreiksi
        const expandedColors = expandColorGroups(selectedColorGroups);
        if (expandedColors.length > 0) {
          // Lisätään värit suoraan metadataan
          filters.colors = expandedColors as ProductMetadata["colors"];
        }
      }
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [searchStates.cat, searchStates.mat, searchStates.col]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query?.trim()) return;

      setIsLoading(true);
      setHasSearched(true);

      try {
        const filters = buildFilters();

        const searchResults = await searchFurniture(query, {
          minSimilarity: 0.42,
          maxResults: 6,
          ...(filters && { filters }),
        });

        setResults(searchResults);
        setError(null);
      } catch (err) {
        setError("Haussa tapahtui virhe. Yritä uudelleen.");
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [buildFilters],
  );

  const handleSearch = useCallback(
    async (formData: FormData) => {
      const query = formData.get("query") as string;
      if (query?.trim()) {
        await setSearchStates({ ...searchStates, q: query });
        await performSearch(query);
      }
    },
    [searchStates, setSearchStates, performSearch],
  );

  useEffect(() => {
    const query = searchStates.q;
    if (query && !hasSearched) {
      performSearch(query);
    }
  }, []);

  return {
    searchStates,
    setSearchStates,
    results,
    error,
    hasSearched,
    handleSearch,
    isLoading,
  };
}
