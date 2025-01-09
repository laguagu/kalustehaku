import dotenv from "dotenv";
import OpenAI from "openai";
import { ProductMetadata } from "./lib/types/metadata/metadata";
dotenv.config();

// Apufunktio cosine similarity laskentaan
function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  const dotProduct = embedding1.reduce(
    (sum, val, i) => sum + val * embedding2[i],
    0,
  );
  const magnitude1 = Math.sqrt(
    embedding1.reduce((sum, val) => sum + val * val, 0),
  );
  const magnitude2 = Math.sqrt(
    embedding2.reduce((sum, val) => sum + val * val, 0),
  );
  return dotProduct / (magnitude1 * magnitude2);
}

function generateNaturalDescriptions(metadata: ProductMetadata): string[] {
  const descriptions = [];

  // Yhdistetty huonekalu ja värikuvaus
  if (metadata.colors.length > 0) {
    const colorDesc =
      metadata.colors.length === 1
        ? `Huonekalu on ${metadata.colors[0].toLowerCase()} värinen ${metadata.category.toLowerCase().slice(0, -1)}`
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
        ? `Valmistettu materiaalista ${metadata.materials[0].toLowerCase()}`
        : `Valmistusmateriaalit: ${metadata.materials.join(" ja ").toLowerCase()}`;
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

  return descriptions.map((desc) => desc.toLowerCase());
}

async function generateEmbedding(metadata: ProductMetadata): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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

async function generateSearchEmbedding(searchText: string): Promise<number[]> {
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
    console.error("Error generating search embedding:", error);
    throw error;
  }
}

async function main() {
  // Testimeta kaksi erilaista huonekalua
  const testProducts: ProductMetadata[] = [
    {
      style: "moderni",
      materials: ["metalli"],
      brand: "",
      category: "työpöydät",
      mainGategory: "pöydät",
      colors: ["valkoinen", "harmaa"],
      roomType: ["työhuone"],
      functionalFeatures: ["sähkösäätöinen", "kulmamalli"],
      designStyle: "moderni toimistotyyli",
      condition: "käyttökuntoinen",
      suitableFor: ["toimistotyö", "kotitoimisto"],
      visualDescription:
        "Kulmasähköpöytä, jossa on moderni ja minimalistinen muotoilu. Pöydän runko on metallinen ja väriltään harmaa, kun taas pöytälevy on valkoinen. Sähkösäätöinen mekanismi mahdollistaa pöydän korkeuden säätämisen ergonomisesti sopivaksi eri käyttäjille.",
    },
    {
      style: "skandinaavinen",
      materials: ["puu"],
      brand: "Isku",
      category: "työtuolit",
      mainGategory: "tuolit",
      colors: ["musta"],
      roomType: ["työhuone"],
      functionalFeatures: ["säädettävä korkeus", "käsinojat", "selkänoja"],
      designStyle: "ergonominen toimistotyyli",
      condition: "hyväkuntoinen",
      suitableFor: ["toimistotyö", "etätyö"],
      visualDescription:
        "Ergonominen työtuoli mustalla verhoilulla ja puisilla yksityiskohdilla. Tuolissa on säädettävä korkeus, käsinojat ja tukeva selkänoja.",
    },
  ];

  const searchQueries = [
    "valkoinen sähköpöytä",
    "musta toimistotuoli",
    "puinen työtuoli",
    "metallinen pöytä",
    "ergonominen työtuoli mustalla verhoilulla",
    "harmaa pöytä", // Testi värien löytymiselle
    "valkoinen ja harmaa työpöytä", // Testi useamman värin haulle
  ];

  try {
    // Generoi embeddings tuotteille
    console.log("Generoidaan embeddings tuotteille...\n");
    const productEmbeddings = await Promise.all(
      testProducts.map((product) => generateEmbedding(product)),
    );

    // Testaa jokaista hakua
    for (const query of searchQueries) {
      console.log(`\nHakutesti: "${query}"`);
      const searchEmbedding = await generateSearchEmbedding(query);

      // Laske similarity jokaisen tuotteen kanssa
      const similarities = productEmbeddings.map((productEmbed, index) => ({
        product: testProducts[index],
        similarity: cosineSimilarity(searchEmbedding, productEmbed),
      }));

      // Järjestä tulokset
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Tulosta tulokset
      similarities.forEach((result, index) => {
        console.log(`\nTulos ${index + 1}:`);
        console.log(
          `Tuote: ${result.product.category} (${result.product.colors.join(", ")})`,
        );
        console.log(`Similarity score: ${result.similarity.toFixed(4)}`);
        console.log(`Materiaalit: ${result.product.materials.join(", ")}`);
      });
    }
  } catch (error) {
    console.error("Virhe testauksessa:", error);
  }
}

// Aja testi
main().catch(console.error);
