"use client";
import { ProductCard } from "@/components/product-card";
import SearchForm from "@/components/search-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchWithFilters } from "@/lib/hooks/useSearchWithFilters";
import { Suspense } from "react";

export interface SearchResult {
  id: string;
  name: string;
  price: number | null;
  image_url: string;
  product_url: string;
  condition: string;
  metadata: {
    style: string;
    materials: string[];
    colors: string[];
    category: string;
    roomType: string[];
    functionalFeatures: string[];
    designStyle: string;
    condition: string;
    suitableFor: string[];
    visualDescription: string;
  };
  similarity: number;
}

export interface SearchResult {
  id: string;
  name: string;
  price: number | null;
  image_url: string;
  product_url: string;
  condition: string;
  metadata: {
    style: string;
    materials: string[];
    colors: string[];
    category: string;
    roomType: string[];
    functionalFeatures: string[];
    designStyle: string;
    condition: string;
    suitableFor: string[];
    visualDescription: string;
  };
  similarity: number;
}

export default function TavaraTradingSearch() {
  const {
    searchStates,
    setSearchStates,
    results,
    error,
    hasSearched,
    handleSearch,
    isLoading,
  } = useSearchWithFilters();

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchStates({ ...searchStates, q: e.target.value || "" });
  };

  return (
    <div className="min-h-screen bg-gray-100/60">
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        {/* Hero section */}
        <div className="text-center py-8 space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Löydä täydellinen huonekalu
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-roboto">
            Etsi käytettyjä huonekaluja kuvailemalla mitä etsit. Tekoäly auttaa
            löytämään toiveitasi vastaavat huonekalut.
          </p>
        </div>

        {/* Search Form */}
        <Suspense>
          <SearchForm
            searchStates={searchStates}
            handleQueryChange={handleQueryChange}
            handleSearch={handleSearch}
            isLoading={isLoading}
            error={error}
          />
        </Suspense>

        {/* Results section */}
        {!isLoading && results.length > 0 && (
          <div className="pt-8">
            <div className="hidden md:flex justify-between items-center mb-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Löydetyt käytetyt huonekalut
                </h2>
                <p className="text-sm text-gray-500">
                  Hakusanasi parhaiten vastaavat tuotteet ({results.length}{" "}
                  {results.length === 1 ? "tulos" : "tulosta"})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-gray-50">
                  90-100% = Erinomainen vastaavuus
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  70-89% = Hyvä vastaavuus
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  42-69% = Kohtalainen vastaavuus
                </Badge>
              </div>
            </div>

            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-[4/3] bg-gray-200" />
                      <CardContent className="p-4 space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result, index) => (
                  <ProductCard
                    key={result.id}
                    result={result}
                    isBestMatch={index === 0}
                  />
                ))}
              </div>
            </Suspense>

            {results.some((r) => r.similarity < 0.5) && (
              <Alert className="mt-6 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  Jotkin hakutuloksista ovat alle 42% vastaavuudella. Kokeile
                  tarkentaa hakusanojasi saadaksesi osuvampia tuloksia.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* No results state */}
        {!isLoading && results.length === 0 && hasSearched && !error && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="max-w-md mx-auto space-y-4">
              <p className="text-gray-500 text-lg">
                Hakusanalla ei löytynyt tuloksia
              </p>
              <p className="text-gray-400 text-sm">
                Kokeile erilaisia hakusanoja tai kuvaile huonekalua eri tavalla
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && hasSearched && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <CardContent className="p-4 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
