// lib/ai/embeddings.ts
import OpenAI from "openai";
import { ProductMetadata } from "../types";

export async function generateEmbedding(
  metadata: ProductMetadata
): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const textForEmbedding = `
  ${metadata.visualDescription}

  Tämä ${metadata.style.toLowerCase()} huonekalu on tyyliltään ${metadata.designStyle.toLowerCase()} ja valmistettu materiaaleista: ${metadata.materials.join(", ").toLowerCase()}. 
  Värimaailmaltaan tuote on ${metadata.colors.join(", ").toLowerCase()}.
  Siinä on seuraavat ominaisuudet: ${metadata.functionalFeatures.join(", ").toLowerCase()}.
  Sopii erityisesti tiloihin: ${metadata.roomType.join(", ").toLowerCase()}.
  Soveltuu käyttötarkoituksiin: ${metadata.suitableFor.join(", ").toLowerCase()}.
  Tuotteen kategoria on ${metadata.category.toLowerCase()}.
  Tuotteen kunto: ${metadata.condition.toLowerCase()}.
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
