import { ProductMetadata } from "../metadata/metadata";

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
