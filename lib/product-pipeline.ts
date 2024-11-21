import { scrapeProducts } from "@/lib/scripts/scraper";
import pLimit from "p-limit";
import { analyzeProduct } from "./ai/product-analyzer";
import {
  getProductById,
  prepareProductForDB,
  upsertProduct,
} from "./db/queries";
import { PipelineResults, ProductMetadata, ScrapedProduct } from "./types";

const MAX_CONCURRENT_URLS = 3; // Montako URL:ää käsitellään rinnakkain
const MAX_CONCURRENT_PRODUCTS = 5; // Montako tuotetta per URL käsitellään rinnakkain
const RATE_LIMIT_DELAY = 1000; // 1 sekunti OpenAI pyyntöjen välillä

// Apufunktio odottamiseen
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Käsiteltävät URL:it. Ellei annettu parametrina, käytetään oletusarvoja. Poista kommentit käyttääksesi kaikkia kategorioita.
export const PRODUCT_URLS = [
  "https://www.tavaratrading.com/toimistokalusteet/48/sahkopoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/1/tyo-satula-ja-valvomotuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/4/tyopoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/7/sailytys",
  // "https://www.tavaratrading.com/toimistokalusteet/10/neuvottelupoydat-ja-tuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/194/korkeat-poydat-ja-tuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/13/sohvat-nojatuolit-penkit-ja-rahit",
  // "https://www.tavaratrading.com/toimistokalusteet/189/sohvapoydat-pikku-poydat-ja-jakkarat",
  // "https://www.tavaratrading.com/toimistokalusteet/14/sermit-ja-akustiikka",
  // "https://www.tavaratrading.com/toimistokalusteet/37/valaisimet",
  // "https://www.tavaratrading.com/toimistokalusteet/67/matot",
  // "https://www.tavaratrading.com/toimistokalusteet/17/lisavarusteet",
  // "https://www.tavaratrading.com/toimistokalusteet/110/ravintolakalusteet",
];

async function processProduct(
  product: ScrapedProduct,
  results: PipelineResults,
): Promise<void> {
  try {
    results.scraping.totalProcessed++;

    const existingProduct = await getProductById(product.id);
    let productWithMetadata: ScrapedProduct & { metadata: ProductMetadata };

    if (!existingProduct) {
      console.log(`Analyzing new product: ${product.name}`);
      const metadata = await analyzeProduct(product);
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
      };
    } else {
      console.log(`Using existing metadata for product: ${product.name}`);
      productWithMetadata = {
        ...product,
        metadata: existingProduct.metadata,
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

// Web screippaus ja tuotteiden käsittely
async function processUrl(
  url: string,
  productsPerUrl: number,
  results: PipelineResults,
): Promise<void> {
  try {
    console.log(`\nProcessing URL: ${url}`);
    const scrapedProducts = await scrapeProducts(url);
    const productsToProcess = scrapedProducts.slice(0, productsPerUrl);

    console.log(
      `Found ${scrapedProducts.length} products, processing ${productsToProcess.length}`,
    );

    // Rajoita samanaikaisten tuotteiden prosessointia
    const productLimit = pLimit(MAX_CONCURRENT_PRODUCTS);
    await Promise.all(
      productsToProcess.map((product) =>
        productLimit(() => processProduct(product, results)),
      ),
    );
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    results.scraping.errors.push(`Error processing URL ${url}: ${error}`);
  }
}

export async function processProducts(options?: {
  urls?: string[];
  productsPerUrl?: number;
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

    console.log(
      `Starting product scraping for ${urlsToProcess.length} URLs...`,
    );
    console.log(`Processing max ${productsPerUrl} products per URL`);
    console.log(`Max concurrent URLs: ${MAX_CONCURRENT_URLS}`);
    console.log(`Max concurrent products per URL: ${MAX_CONCURRENT_PRODUCTS}`);

    // Rajoita samanaikaisten URL:ien prosessointia
    const urlLimit = pLimit(MAX_CONCURRENT_URLS);
    await Promise.all(
      urlsToProcess.map((url) =>
        urlLimit(() => processUrl(url, productsPerUrl, results)),
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
