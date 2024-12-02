//app/actions.ts
"use server";

import { createClient } from "@/lib/db/supabase/server-client";
import {
  FurnitureFiltterObject,
  ProductMetadata,
} from "@/lib/types/metadata/metadata";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { OpenAI } from "openai";

export async function generateAIFilters(
  searchQuery: string,
): Promise<Partial<ProductMetadata>> {
  const prompt = `
  Olet huonekaluasiantuntija. Analysoi käyttäjän hakuteksti ja
  palauta filtterit JSON-muodossa. 
  Jos et ole varma jostain kentästä, palauta sille tyhjä arvo.

  Hakuteksti:
  ${searchQuery}
  `;

  try {
    const { object: classification } = await generateObject({
      model: openai("gpt-4o", { structuredOutputs: true }),
      schema: FurnitureFiltterObject,
      prompt: prompt,
    });

    console.log(classification);
    return classification;
  } catch (error) {
    console.error("Error generating AI filters:", error);
    return {
      mainGategory: undefined,
      materials: [],
      colors: [],
    };
  }
}

export async function generateSearchEmbedding(
  searchText: string,
): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

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
    filters?: Partial<ProductMetadata>;
  } = {},
): Promise<[]> {
  const { minSimilarity = 0.42, maxResults = 6, filters = {} } = options;
  try {
    const embedding = await generateSearchEmbedding(searchQuery);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("match_furnitures_with_filter", {
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

// HUOM!
// Ei välttämättä hyvä ratkaisu ja ei tarpeen käyttää tätä

// async function enhanceSearchQuery(rawQuery: string): Promise<string> {
//   try {
//     const { text: optimizedQuery } = await generateText({
//       model: openai("gpt-4o-mini"),
//       system: "Olet huonekaluhakujen optimoija. Optimoi käyttäjän hakuteksti semanttista hakua varten mikäli tarvetta. Jos hakuteksti on jo optimaalinen, palauta se sellaisenaan.",
//       prompt: rawQuery
//     });

//     return optimizedQuery;

//   } catch (error) {
//     console.error("Query enhancement failed:", error);
//     return rawQuery;
//   }
// }
