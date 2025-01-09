"use server";
import { generateSearchEmbedding } from "@/app/(ai)/actions";
import { createClient } from "@/lib/db/supabase/server-client";
import { ProductMetadata } from "@/lib/types/metadata/metadata";
import { dbConfig } from "../config";

export async function searchFurniture(
  searchQuery: string,
  options: {
    minSimilarity?: number;
    maxResults?: number;
    filters?: Partial<ProductMetadata>;
  } = {},
): Promise<[]> {
  const { minSimilarity = 0.42, maxResults = 6, filters = {} } = options;
  try {
    const normalizedQuery = searchQuery.toLowerCase(); // toLowerCase() koska vertailtava data on pienellä kirjoitettua myös. Parantaa hakutulosta.
    const embedding = await generateSearchEmbedding(normalizedQuery);

    const supabase = await createClient();

    const matchFunction = dbConfig.getMatchFunction();

    const { data, error } = await supabase.rpc(matchFunction, {
      query_embedding: embedding,
      match_threshold: minSimilarity,
      match_count: maxResults,
      filter: filters,
    });

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Haku epäonnistui: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}
