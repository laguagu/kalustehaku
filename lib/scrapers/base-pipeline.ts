// lib/scrapers/shared/base-pipeline.ts
import {
  getProductByIdAndCompany,
  prepareProductForDB,
  upsertProduct,
} from "@/lib/db/queries";
import {
  PipelineConfig,
  PipelineResults,
  ProductWithMetadata,
  ScrapedProduct,
  ScraperConfig,
} from "@/lib/types/products/types";
import pLimit from "p-limit";
import { generateFurnitureMetadata } from "../ai/product-analyzer";

const MAX_CONCURRENT_URLS = 2;
const MAX_CONCURRENT_PRODUCTS = 5;
const RATE_LIMIT_DELAY = 1000;

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface PipelineOptions {
  urls?: string[];
  productsPerUrl?: number;
  isTestData?: boolean;
  company: string;
}

async function processProduct(
  product: ScrapedProduct,
  results: PipelineResults,
  config: PipelineConfig,
): Promise<void> {
  try {
    results.scraping.totalProcessed++;
    const existingProduct = await getProductByIdAndCompany(
      product.id,
      config.company,
    );

    let productWithMetadata: ProductWithMetadata;

    if (!existingProduct) {
      console.log(`Analyzing new product: ${product.name}`);
      const metadata = await generateFurnitureMetadata(product);
      await delay(RATE_LIMIT_DELAY);

      productWithMetadata = {
        ...product,
        metadata: metadata || {
          style: "moderni",
          materials: [],
          category: "muut",
          colors: [],
          roomType: [],
          functionalFeatures: [],
          designStyle: "",
          condition: "Ei tietoa",
          suitableFor: [],
          visualDescription: "Ei kuvausta saatavilla",
        },
        isTestData: config.isTestData,
      };
    } else {
      console.log(`Using existing metadata for product: ${product.name}`);
      productWithMetadata = {
        ...product,
        metadata: existingProduct.metadata,
        isTestData: config.isTestData,
      };
    }

    const preparedProduct = await prepareProductForDB(productWithMetadata);
    await upsertProduct(preparedProduct);

    results.scraping.successful++;
    results.products.push({
      id: product.id,
      name: product.name,
      status: "success",
      action: existingProduct ? "updated" : "created",
    });
  } catch (error) {
    results.scraping.failed++;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    results.products.push({
      id: product.id,
      name: product.name,
      status: "error",
      error: errorMessage,
    });
    results.scraping.errors.push(
      `Error processing ${product.name}: ${errorMessage}`,
    );
    console.error(`Error processing product ${product.name}:`, error);
  }
}

async function processUrl(
  url: string,
  productsPerUrl: number,
  results: PipelineResults,
  config: PipelineConfig,
  scrapeProductsFn: (
    url: string,
    config: ScraperConfig,
  ) => Promise<ScrapedProduct[]>,
): Promise<void> {
  try {
    console.log(`\nProcessing URL: ${url}`);
    const scrapedProducts = await scrapeProductsFn(url, {
      company: config.company,
    });
    const productsToProcess = scrapedProducts.slice(0, productsPerUrl);

    console.log(
      `Found ${scrapedProducts.length} products, processing ${productsToProcess.length}`,
    );

    const productLimit = pLimit(MAX_CONCURRENT_PRODUCTS);
    await Promise.all(
      productsToProcess.map((product) =>
        productLimit(() => processProduct(product, results, config)),
      ),
    );
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    results.scraping.errors.push(`Error processing URL ${url}: ${error}`);
  }
}

export async function processProducts(
  scrapeProductsFn: (
    url: string,
    config: ScraperConfig,
  ) => Promise<ScrapedProduct[]>,
  options: PipelineOptions,
): Promise<PipelineResults> {
  const results: PipelineResults = {
    scraping: {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
    },
    products: [],
  };

  try {
    const {
      urls = [],
      productsPerUrl = 100,
      isTestData = false,
      company,
    } = options;

    const config: PipelineConfig = {
      isTestData,
      company,
    };

    console.log(
      `Starting ${isTestData ? "TEST" : "PRODUCTION"} product scraping for ${urls.length} URLs...`,
    );
    console.log(`Company: ${company}`);

    const urlLimit = pLimit(MAX_CONCURRENT_URLS);
    await Promise.all(
      urls.map((url) =>
        urlLimit(() =>
          processUrl(url, productsPerUrl, results, config, scrapeProductsFn),
        ),
      ),
    );

    console.log("\nProcessing Summary:");
    console.log(`Total Processed: ${results.scraping.totalProcessed}`);
    console.log(`Successful: ${results.scraping.successful}`);
    console.log(`Failed: ${results.scraping.failed}`);
    console.log(`Errors: ${results.scraping.errors.length}`);

    return results;
  } catch (error) {
    console.error("Pipeline error:", error);
    throw error;
  }
}
