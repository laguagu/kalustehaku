import { getProductByIdAndCompany, upsertProduct } from "@/lib/db/queries";
import {
  PipelineConfig,
  PipelineResults,
  PreparedProduct,
  ProductWithMetadata,
  ScrapedProduct,
  ScraperConfig,
} from "@/lib/types/products/types";
import pLimit from "p-limit";
import { generateEmbedding } from "../ai/generate-embedding";
import { generateFurnitureMetadata } from "../ai/product-analyzer";
import { generateSearchTerms } from "../utils";
import { syncProducts } from "./sync-products";

// Helper to convert number to decimal string
function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return price.toFixed(2);
}

// Prepare product data for database. Generate embedding and search terms
export async function prepareProductForDB(
  product: ProductWithMetadata,
): Promise<PreparedProduct> {
  let embedding = null;
  try {
    embedding = await generateEmbedding(product.metadata);
  } catch (error) {
    console.warn(
      `Warning: Failed to generate embedding for ${product.id}:`,
      error,
    );
  }

  const searchTerms = generateSearchTerms(product.metadata);

  return {
    ...product,
    price: formatPrice(product.price),
    embedding,
    searchTerms,
    updatedAt: new Date(),
    isTestData: product.isTestData,
  };
}

const MAX_CONCURRENT_URLS = 2;
const MAX_CONCURRENT_PRODUCTS = 13;
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
      const metadata = await generateFurnitureMetadata(product);
      await delay(RATE_LIMIT_DELAY);

      productWithMetadata = {
        ...product,
        metadata: metadata || {
          mainGategory: "muut",
          brand: "",
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
): Promise<ScrapedProduct[]> {
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

    return productsToProcess;
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    results.scraping.errors.push(`Error processing URL ${url}: ${error}`);
    return [];
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
      productsPerUrl = 200,
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

    // Kerää kaikki scrapatut tuotteet yhteen listaan
    let allScrapedProducts: ScrapedProduct[] = [];

    const urlLimit = pLimit(MAX_CONCURRENT_URLS);
    const urlResults = await Promise.all(
      urls.map((url) =>
        urlLimit(() =>
          processUrl(url, productsPerUrl, results, config, scrapeProductsFn),
        ),
      ),
    );

    // Yhdistä kaikki onnistuneesti scrapatut tuotteet
    allScrapedProducts = urlResults.flat();
    console.log("\nScraped products length:", allScrapedProducts.length);

    // Jos scraping onnistui ilman virheitä, synkronoidaan tuotteet
    if (results.scraping.errors.length === 0) {
      console.log("\nStarting product synchronization...");
      const syncResults = await syncProducts(allScrapedProducts, {
        company,
        urls,
        isTestData,
      });

      // Lisää sync tulokset kokonaistuloksiin
      results.scraping.errors.push(...syncResults.scraping.errors);
      if (syncResults.removedProducts?.length > 0) {
        console.log(
          `Removed ${syncResults.removedProducts.length} outdated products`,
        );
        results.products.push(...syncResults.removedProducts);
      }
    } else {
      console.log("\nSkipping product synchronization due to scraping errors");
    }

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
