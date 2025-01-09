import axios from "axios";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { FurnitureMetadataSchema } from "../types/metadata/metadata";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data).toString("base64");
  } catch {
    console.log(`Kuva puuttuu URL:sta: ${imageUrl}`);
    return null;
  }
}

export async function generateFurnitureMetadata(product: {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  condition: string;
  imageUrl: string;
  category: string;
  availability: string;
}) {
  try {
    const imageBase64 = product.imageUrl
      ? await getImageAsBase64(product.imageUrl)
      : null;

    // Prepare messages array
    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `
Olet kokenut sisustussuunnittelija ja huonekaluasiantuntija, joka analysoi huonekaluja ja luo niistä tarkkaa metadataa semanttista hakua varten.

MATERIAALIEN TUNNISTUS:
- Huomioi että valkoiset pinnat voivat olla useaa eri materiaalia (laminaatti, melamiini, maalattu puu, jne)
- Työpöytien kannet ovat tyypillisesti laminoitua tai melamiinipinnoitettua lastulevyä tai MDF-levyä
- Jos et pysty varmasti tunnistamaan materiaalia, jätä se mainitsematta

YLEISET OHJEET:
- Keskity kuvailemaan huonekalua ammattilaisen näkökulmasta
- Pyri tunnistamaan valmistaja ja brändi tuotteen nimestä tai kuvauksesta (esim. "ISKU sähköpöytä" -> brändi: "Isku")
- Jos et pysty analysoimaan jotain ominaisuutta varmasti, jätä kenttä tyhjäksi arvaamisen sijaan
`,
      },
    ];

    // Create user message content
    const userContent: (
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    )[] = [
      {
        type: "text" as const,
        text: `Analysoi tämä huonekalu sisustussuunnittelijan näkökulmasta:

        TUOTETIEDOT:
        Nimi: ${product.name}
        Kuvaus: ${product.description || "Ei kuvausta"}
        Kunto: ${product.condition}
        Kategoria: ${product.category}
        Saatavuus: ${product.availability}
        
        Huomioi erityisesti:
        - Tyyli ja design
        - Materiaalit ja värit
        - Käyttötarkoitukset ja soveltuvuus eri tiloihin
        - Ergonomiset ominaisuudet
        - Kunnon vaikutus käytettävyyteen
        - Yhdisteltävyys muihin kalusteisiin`,
      },
    ];

    // Add image if available
    if (imageBase64) {
      userContent.push({
        type: "image_url" as const,
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      });
    }

    // Add user message to messages array
    messages.push({
      role: "user",
      content: userContent,
    });

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o",
      messages,
      response_format: zodResponseFormat(
        FurnitureMetadataSchema,
        "furniture_metadata",
      ),
      max_tokens: 1000,
      temperature: 0.3,
    });

    // Check for refusal
    if (completion.choices[0].message.refusal) {
      throw new Error(
        `Analysis refused: ${completion.choices[0].message.refusal}`,
      );
    }

    // Check for incomplete response
    if (completion.choices[0].finish_reason === "length") {
      throw new Error("Analysis incomplete due to token limit");
    }

    return completion.choices[0].message.parsed;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI API error:", error.message);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    console.error("Error analyzing product:", error);
    throw error;
  }
}
