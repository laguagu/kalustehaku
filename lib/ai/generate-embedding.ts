import OpenAI from "openai";
import { ProductMetadata } from "../types/metadata/metadata";

function generateNaturalDescriptions(metadata: ProductMetadata): string[] {
  const descriptions = [];

  // Yhdistetty huonekalu ja värikuvaus
  if (metadata.colors.length > 0) {
    const colorDesc =
      metadata.colors.length === 1
        ? `Huonekalu on ${metadata.colors[0].toLowerCase()} värinen ${metadata.category.toLowerCase().slice(0, -1)}` // Poistetaan monikko ("t") lopusta
        : `Huonekalun värit ovat ${metadata.colors.join(" ja ").toLowerCase()}`;
    descriptions.push(colorDesc);
  }

  descriptions.push(`Tuotetyyppi: ${metadata.category.toLowerCase()}`);
  descriptions.push(`Pääkategoria: ${metadata.mainGategory.toLowerCase()}`);

  // Värit vielä erikseen hakuja varten
  if (metadata.colors.length > 0) {
    descriptions.push(`Värit: ${metadata.colors.join(" ").toLowerCase()}`);
  }

  if (metadata.materials.length > 0) {
    const materialDesc =
      metadata.materials.length === 1
        ? `Se on valmistettu materiaalista ${metadata.materials[0].toLowerCase()}`
        : `Sen materiaaleja ovat ${metadata.materials.join(" ja ").toLowerCase()}`;
    descriptions.push(materialDesc);
  }

  // Tyylin kuvaus
  if (metadata.style && metadata.designStyle) {
    descriptions.push(
      `Tyyliltään huonekalu edustaa ${metadata.style.toLowerCase()} suuntausta ja ${metadata.designStyle.toLowerCase()}.`,
    );
  }

  // Käyttötarkoitus ja sijoitus
  if (metadata.suitableFor.length > 0) {
    descriptions.push(
      `Soveltuu käytettäväksi: ${metadata.suitableFor.join(", ").toLowerCase()}.`,
    );
  }

  if (metadata.roomType.length > 0) {
    descriptions.push(
      `Suunniteltu käytettäväksi tiloissa: ${metadata.roomType.join(", ").toLowerCase()}.`,
    );
  }

  // Toiminnalliset ominaisuudet
  if (metadata.functionalFeatures.length > 0) {
    descriptions.push(
      `Huonekalun ominaisuuksiin kuuluu: ${metadata.functionalFeatures.join(", ").toLowerCase()}.`,
    );
  }

  // Brändi jos saatavilla
  if (metadata.brand) {
    descriptions.push(`Valmistaja: ${metadata.brand.toLowerCase()}.`);
  }

  // Kunto
  descriptions.push(`Huonekalun kunto: ${metadata.condition.toLowerCase()}.`);

  // Muutetaan kaikki tekstit pienille kirjaimille, koska hakutermikin on pienellä
  return descriptions.map((desc) => desc.toLowerCase());
}

export async function generateEmbedding(
  metadata: ProductMetadata,
): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 3,
  });

  const naturalDescriptions = generateNaturalDescriptions(metadata);

  const textForEmbedding = `
${naturalDescriptions.join("\n")}

${metadata.visualDescription}`.trim();

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
