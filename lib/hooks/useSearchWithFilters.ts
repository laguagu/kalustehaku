import { generateAIFilters } from "@/app/(ai)/actions";
import { useCallback, useEffect } from "react";
import { searchFurniture } from "../db/supabase/server-queries";
import {
  FurnitureMainCategoryEnum,
  FurnitureMaterialEnum,
  ProductMetadata,
} from "../types/metadata/metadata";
import { SupabaseProduct } from "../types/search/types";
import {
  cleanFilters,
  expandColorGroups,
  findColorGroups,
} from "../utils/filters-colors";
import { useSearchStates } from "./useSearchStates";

export function useSearchWithFilters() {
  const {
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
  } = useSearchStates();

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
  }, [searchStates]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!query?.trim()) return;
      setHasSearched(true);

      try {
        let filters;

        if (searchStates.ai) {
          // Haetaan AI:n ehdottamat filtterit
          const aiFilters = await generateAIFilters(query);
          filters = { ...aiFilters };

          // Käsitellään värit jos niitä on
          if (aiFilters.colors && aiFilters.colors.length > 0) {
            const colorGroups = findColorGroups(aiFilters.colors);
            const expandedColors = expandColorGroups(colorGroups);
            if (expandedColors.length > 0) {
              filters.colors = expandedColors as ProductMetadata["colors"];
            }
          }

          // Päivitetään URL-parametrit erillään väritarkistuksesta
          const updates: Partial<typeof searchStates> = {
            cat: aiFilters.mainGategory || "",
            mat: aiFilters.materials?.join(",") || "",
            col: aiFilters.colors?.length
              ? findColorGroups(aiFilters.colors).join(",")
              : "",
          };
          await setSearchStates((prev) => ({
            ...prev,
            ...updates,
          }));
        } else {
          filters = buildFilters();
        }

        const cleanedFilters = cleanFilters(filters);

        try {
          const searchResults: SupabaseProduct[] = await searchFurniture(
            query,
            {
              minSimilarity: 0.42,
              ...(cleanedFilters && { filters: cleanedFilters }),
            },
          );
          setResults(searchResults);
          setError(null);
        } catch (err) {
          setError("Haussa tapahtui virhe. Yritä uudelleen.");
          console.error("Search error:", err);
        }
      } catch (err) {
        setError("AI-filtterien haussa tapahtui virhe.");
        console.error("AI filters error:", err);
      }
    },
    [
      buildFilters,
      searchStates.ai,
      setError,
      setHasSearched,
      setResults,
      setSearchStates,
    ],
  );

  const handleSearch = useCallback(
    async (formData: FormData) => {
      const query = formData.get("query") as string;
      if (query?.trim()) {
        startSearch(async () => {
          await setSearchStates({ ...searchStates, q: query });
          await performSearch(query);
        });
      }
    },
    [searchStates, setSearchStates, performSearch, startSearch],
  );

  useEffect(() => {
    const query = searchStates.q;
    if (query && !hasSearched) {
      performSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
