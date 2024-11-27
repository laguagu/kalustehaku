import pLimit from "p-limit";
import { generateFurnitureMetadata } from "../../ai/product-analyzer";
import {
  getProductById,
  prepareProductForDB,
  upsertProduct,
} from "../../db/queries";
import { ProductMetadata } from "../../types/metadata/metadata";
import {
  PipelineConfig,
  PipelineResults,
  ScrapedProduct,
} from "../../types/products/types";
import {
  MAX_CONCURRENT_PRODUCTS,
  MAX_CONCURRENT_URLS,
  PRODUCT_URLS,
  RATE_LIMIT_DELAY,
} from "../constants";
import { scrapeProducts } from "./scraper";

// Apufunktio odottamiseen
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processProducts(options?: {
  urls?: string[];
  productsPerUrl?: number;
  isTestData?: boolean;
}): Promise<PipelineResults> {
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
    const urlsToProcess = options?.urls || PRODUCT_URLS;
    const productsPerUrl = options?.productsPerUrl || 70;
    const config: PipelineConfig = {
      isTestData: options?.isTestData || false,
    };

    console.log(
      `Starting product scraping for ${urlsToProcess.length} URLs...`,
    );

    // Rajoita samanaikaisten URL:ien prosessointia
    const urlLimit = pLimit(MAX_CONCURRENT_URLS);
    await Promise.all(
      urlsToProcess.map((url) =>
        urlLimit(() => processUrl(url, productsPerUrl, results, config)),
      ),
    );

    // Yhteenveto
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

// Web screippaus ja tuotteiden käsittely
async function processUrl(
  url: string,
  productsPerUrl: number,
  results: PipelineResults,
  config: PipelineConfig,
): Promise<void> {
  try {
    console.log(`\nProcessing URL: ${url}`);
    const scrapedProducts = await scrapeProducts(url, {
      company: "Tavara-Trading",
    });
    const productsToProcess = scrapedProducts.slice(0, productsPerUrl);

    console.log(
      `Found ${scrapedProducts.length} products, processing ${productsToProcess.length}`,
    );

    // Rajoita samanaikaisten tuotteiden prosessointia
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

async function processProduct(
  product: ScrapedProduct,
  results: PipelineResults,
  config: PipelineConfig,
): Promise<void> {
  try {
    results.scraping.totalProcessed++;

    const existingProduct = await getProductById(product.id);
    let productWithMetadata: ScrapedProduct & {
      metadata: ProductMetadata;
      isTestData: boolean; // Lisätään isTestData
    };

    if (!existingProduct) {
      console.log(`Analyzing new product: ${product.name}`);
      const metadata = await generateFurnitureMetadata(product);
      await delay(RATE_LIMIT_DELAY); // Rajoitetaan OpenAI API kutsuja

      productWithMetadata = {
        ...product,
        metadata: metadata || {
          style: "",
          materials: [],
          category: "",
          colors: [],
          roomType: [],
          functionalFeatures: [],
          designStyle: "",
          condition: "",
          suitableFor: [],
          visualDescription: "",
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
