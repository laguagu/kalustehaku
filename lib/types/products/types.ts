//lib types/products/types.ts
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
  company: string;
}

export interface ProductWithMetadata extends ScrapedProduct {
  metadata: ProductMetadata;
  isTestData: boolean;
}

export interface ScraperConfig {
  company: string;
}

export interface PipelineConfig {
  isTestData: boolean;
  company: string;
}

export interface ScraperOptions {
  urls?: string[];
  productsPerUrl?: number;
  isTestData?: boolean;
  isCron?: boolean;
  company: string;
}

export interface PreparedProduct extends Omit<ScrapedProduct, "price"> {
  price: string | null;
  metadata: ProductMetadata;
  embedding: number[] | null;
  searchTerms?: string;
  updatedAt?: Date;
  isTestData: boolean;
}

export interface ProcessedProduct {
  id: string;
  name: string;
  status: "success" | "error" | "skipped";
  error?: string;
  action?: "created" | "updated" | "deleted";
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
  company?: string;
  isTestData?: boolean;
}
