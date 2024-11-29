import { SearchFilters } from "@/components/search-filters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, SlidersHorizontal } from "lucide-react";
import React, { useState } from "react";
import { SearchInfo } from "./search-info";

interface SearchFormProps {
  searchStates: { q: string };
  handleQueryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: (formData: FormData) => void;
  isLoading: boolean;
  error: string | null;
}

export default function SearchForm({
  searchStates,
  handleQueryChange,
  handleSearch,
  isLoading,
  error,
}: SearchFormProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="relative max-w-3xl mx-auto space-y-4">
      {/* Search Info */}
      <SearchInfo />
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Huonekaluhaku</CardTitle>
          <CardDescription>
            Kuvaile haluamaasi huonekalua mahdollisimman tarkasti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSearch(formData);
            }}
          >
            <div className="flex gap-3">
              <Input
                type="text"
                name="query"
                placeholder="Esim: Moderni valkoinen sähköpöytä työhuoneeseen..."
                value={searchStates.q}
                onChange={handleQueryChange}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !searchStates.q.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Haetaan...
                  </>
                ) : (
                  "Hae"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className={`px-3 ${isFilterOpen ? "bg-gray-100" : ""}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="pt-6">
                <SearchFilters />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
