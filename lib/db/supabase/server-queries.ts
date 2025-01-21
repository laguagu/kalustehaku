"use server";
import { generateSearchEmbedding } from "@/app/(ai)/actions";
import { createClient } from "@/lib/db/supabase/server-client";
import { ProductMetadata } from "@/lib/types/metadata/metadata";
import { SupabaseProduct } from "@/lib/types/search/types";
import { BM25Retriever } from "@langchain/community/retrievers/bm25";
import { dbConfig } from "../config";

// // Supabasesta tuleva tuotetyyppi

export async function searchFurniture(
  searchQuery: string,
  options: {
    minSimilarity?: number;
    maxResults?: number;
    filters?: Partial<ProductMetadata>;
  } = {},
): Promise<SupabaseProduct[]> {
  const { minSimilarity = 0.38, maxResults = 6, filters = {} } = options;

  try {
    // 1. Get the query embedding
    const normalizedQuery = searchQuery.toLowerCase();
    const embedding = await generateSearchEmbedding(normalizedQuery);

    // 2. Fetch data from Supabase (vector similarity search)
    const supabase = await createClient();
    const matchFunction = dbConfig.getMatchFunction();
    const { data, error } = await supabase.rpc(matchFunction, {
      query_embedding: embedding,
      match_threshold: minSimilarity,
      match_count: maxResults * 2,
      filter: filters,
    });
    // return data;
    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Haku epäonnistui: ${error.message}`);
    }

    // 3. Convert Supabase rows -> Documents for BM25
    // Include multiple fields to help BM25 with lexical matching
    const documents = (data ?? []).map((doc: SupabaseProduct) => {
      const { visualDescription, colors, brand, materials } = doc.metadata;
      const combinedText = `
        ${doc.name}
        ${visualDescription ?? ""} 
        ${colors?.join(" ") ?? ""} 
        ${brand ?? ""}  
        ${materials?.join(" ") ?? ""}
      `.trim();

      return {
        pageContent: combinedText.toLowerCase(),
        metadata: doc, // keep original data in `metadata`
      };
    });

    // 4. Create the BM25 retriever and re-rank
    const retriever = BM25Retriever.fromDocuments(documents, { k: maxResults });
    const rerankedDocs = await retriever.invoke(normalizedQuery);

    // 5. Convert from BM25 doc -> your SupabaseProduct shape
    const reRankedResults = rerankedDocs.map(
      (doc) => doc.metadata as SupabaseProduct,
    );
    return reRankedResults;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}
