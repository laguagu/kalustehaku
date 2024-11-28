// lib/ai/embeddings.ts
import OpenAI from "openai";
import { ProductMetadata } from "../types/metadata/metadata";

export async function generateEmbedding(
  metadata: ProductMetadata,
): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const textForEmbedding = `
[KUVAUS]
Visuaalinen kuvaus: ${metadata.visualDescription}

[PÄÄOMINAISUUDET]
Tyyli ja kategoria: ${metadata.style.toLowerCase()} ${metadata.category.toLowerCase()} ${metadata.mainGategory.toLowerCase()}
Materiaalit: ${metadata.materials.join(" ").toLowerCase()}
Värit: ${metadata.colors.join(" ").toLowerCase()}
Brändi: ${metadata.brand.toLowerCase()}

[LISÄTIEDOT]
Toiminnalliset ominaisuudet: ${metadata.functionalFeatures.join(" ").toLowerCase()}
Sopivat huoneet: ${metadata.roomType.join(" ").toLowerCase()}
Käyttötarkoitukset: ${metadata.suitableFor.join(" ").toLowerCase()}
Kunto: ${metadata.condition.toLowerCase()}
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
