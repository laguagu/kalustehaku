"use server";

import { createClient } from "@/lib/db/supabase/server-client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSearchEmbedding(
  searchText: string,
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: searchText,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Hakutekstin prosessointi epäonnistui");
  }
}

export async function searchFurniture(
  searchQuery: string,
  options: {
    minSimilarity?: number;
    maxResults?: number;
  } = {},
): Promise<[]> {
  const { minSimilarity = 0.1, maxResults = 1 } = options;

  try {
    const embedding = await generateSearchEmbedding(searchQuery);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("match_furniture", {
      query_embedding: embedding,
      match_threshold: minSimilarity,
      match_count: maxResults,
    });

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Haku epäonnistui");
    }

    return (data || []).sort(
      (a: { similarity: number }, b: { similarity: number }) =>
        b.similarity - a.similarity,
    );
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}
