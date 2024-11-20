// lib/ai/embeddings.ts
import OpenAI from "openai";
import { ProductMetadata } from "../types";

export async function generateEmbedding(
  metadata: ProductMetadata,
): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const textForEmbedding = `
    ${metadata.visualDescription}
    
    Ominaisuudet: ${metadata.functionalFeatures.join(", ").toLowerCase()}
    Sopii tiloihin: ${metadata.roomType.join(", ").toLowerCase()}
    Käyttötarkoitukset: ${metadata.suitableFor.join(", ").toLowerCase()}
    Kunto: ${metadata.condition}
  `.trim();

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textForEmbedding,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}
