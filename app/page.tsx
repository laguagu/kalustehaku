"use client";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { searchFurniture } from "./actions";

export interface SearchResult {
  id: string;
  name: string;
  price: number | null;
  image_url: string; // Huom! snake_case
  product_url: string; // Huom! snake_case
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

function SearchButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type="submit">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Haetaan...
        </>
      ) : (
        "Hae"
      )}
    </Button>
  );
}

export default function TavaraTradingSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(formData: FormData) {
    const searchQuery = formData.get("query") as string;
    if (!searchQuery?.trim()) return;

    try {
      setHasSearched(true);
      const searchResults = await searchFurniture(searchQuery, {
        minSimilarity: 0.25,
        maxResults: 6,
      });
      setResults(searchResults);
      setError(null);
    } catch (err) {
      setError("Haussa tapahtui virhe. Yritä uudelleen.");
      console.error("Search error:", err);
    }
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (!newQuery) {
      setHasSearched(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100/60">
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        {/* Hero section */}
        <div className="text-center py-8 space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Löydä täydellinen huonekalu
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Etsi käytettyjä huonekaluja kuvailemalla mitä etsit. Tekoäly auttaa
            löytämään toiveitasi vastaavat huonekalut.
          </p>
        </div>

        {/* Search form */}
        <form action={handleSearch} className="max-w-3xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Huonekaluhaku</CardTitle>
              <CardDescription>
                Kuvaile haluamaasi huonekalua mahdollisimman tarkasti
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="text"
                  name="query"
                  placeholder="Esim: Moderni valkoinen sähköpöytä työhuoneeseen..."
                  value={query}
                  onChange={handleQueryChange}
                  className="flex-1"
                />
                <div
                  className={
                    !query.trim() ? "pointer-events-none opacity-50" : ""
                  }
                >
                  <SearchButton />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </form>

        {/* Results section */}
        {results.length > 0 && (
          <div className="pt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Löydetyt käytetyt huonekalut
              </h2>
              <p className="text-gray-500">
                {results.length} {results.length === 1 ? "tulos" : "tulosta"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result, index) => (
                <ProductCard
                  key={result.id}
                  result={result}
                  isBestMatch={index === 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results state */}
        {results.length === 0 && hasSearched && !error && (
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
      </div>
    </div>
  );
}
