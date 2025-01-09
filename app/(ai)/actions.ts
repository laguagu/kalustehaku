"use server";

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
