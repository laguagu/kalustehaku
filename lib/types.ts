import { z } from "zod";

export const FurnitureMetadataSchema = z.object({
  style: z
    .string()
    .describe("Vallitseva tyyli (esim. moderni, skandinaavinen, teollinen)"),
  materials: z.array(z.string()).describe("Päämateriaalit listana"),
  category: z.string().describe("Tuotekategoria"),
  colors: z.array(z.string()).describe("Päävärit ja sävyt listana"),
  roomType: z.array(z.string()).describe("Sopivat huoneet/tilat listana"),
  functionalFeatures: z
    .array(z.string())
    .describe("Toiminnalliset ominaisuudet ja erityispiirteet"),
  designStyle: z.string().describe("Suunnittelutyyli ja -aikakausi"),
  condition: z.string().describe("Kunnon tarkempi analyysi"),
  suitableFor: z
    .array(z.string())
    .describe("Sopivat käyttötarkoitukset ja -tilanteet"),
  visualDescription: z
    .string()
    .describe("Yksityiskohtainen visuaalinen kuvaus huonekalusta"),
});

export type ProductMetadata = z.infer<typeof FurnitureMetadataSchema>;

export interface ScrapedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  condition: string;
  imageUrl: string;
  category: string;
  availability: string;
  productUrl: string;
}

export interface PreparedProduct extends Omit<ScrapedProduct, "price"> {
  price: string | null;
  metadata: ProductMetadata;
  embedding: number[] | null;
  searchTerms?: string;
  updatedAt?: Date;
}

export interface ProcessedProduct {
  id: string;
  name: string;
  status: "success" | "error" | "skipped";
  error?: string;
  action?: "created" | "updated";
  message?: string;
}

export interface PipelineResults {
  scraping: {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: string[];
  };
  products: ProcessedProduct[];
}
