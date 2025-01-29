"use client";
import { ProductCard } from "@/components/product-card";
import SearchForm from "@/components/search-form";
import { LoadingCards } from "@/components/skeletons/loading-cards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BoxReveal from "@/components/ui/box-reveal";
import { useSearchWithFilters } from "@/lib/hooks/useSearchWithFilters";
import { motion } from "framer-motion";
import { Suspense } from "react";

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
    <div className="min-h-screen  bg-dot-black/[0.1] relative pb-12">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_70%,black)]"></div>

      <motion.div
        className="w-full max-w-7xl mx-auto p-4 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center items-center text-center py-8">
          <BoxReveal boxColor="hsl(var(--primary))" duration={0.5}>
            <p className="text-[3.5rem] font-semibold py-4">
              Kalustehaku<span className="text-primary">.</span>
            </p>
          </BoxReveal>
        </div>

        <div>
          <Suspense>
            <SearchForm
              searchStates={searchStates}
              handleQueryChange={handleQueryChange}
              handleSearch={handleSearch}
              isLoading={isLoading}
              error={error}
            />
          </Suspense>
        </div>

        {!isLoading && results.length > 0 && (
          <div className="bg-zinc-50 rounded-2xl md:border-2 shadow-lg md:py-6 md:px-12 px-2 py-2 space-y-6">
            <div className="hidden md:flex justify-between items-center mb-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Löydetyt käytetyt kalusteet
                </h2>
                <p className="text-sm text-gray-500">
                  Hakusanasi parhaiten vastaavat tuotteet ({results.length}{" "}
                  {results.length === 1 ? "tulos" : "tulosta"})
                </p>
              </div>
            </div>
            <Suspense fallback={<LoadingCards />}>
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

            {results.some((r) => r.similarity < 0.42) && (
              <Alert className="mt-6 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  Jotkin hakutuloksista ovat alle 42% vastaavuudella. Kokeile
                  tarkentaa hakusanojasi saadaksesi osuvampia tuloksia.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!isLoading && results.length === 0 && hasSearched && !error && (
          <div className="text-center py-16 bg-card rounded-lg shadow-xl">
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
        {isLoading && hasSearched && <LoadingCards />}
      </motion.div>
    </div>
  );
}
