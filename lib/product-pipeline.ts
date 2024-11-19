// lib/product-pipeline.ts
import { scrapeProducts } from "@/lib/scripts/scraper";
import { analyzeProduct } from "./ai/product-analyzer";
import {
  getProductById,
  prepareProductForDB,
  upsertProduct,
} from "./db/queries";
import {
  PipelineResults,
  ProcessedProduct,
  ProductMetadata,
  ScrapedProduct,
} from "./types";

export async function processProducts(url?: string): Promise<PipelineResults> {
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
    console.log("Starting product scraping...");
    const scrapedProducts = await scrapeProducts(
      url ||
        "https://www.tavaratrading.com/toimistokalusteet/1/tyo-satula-ja-valvomotuolit"
    );

    // Käsitellään vain ensimmäinen tuote testauksen aikana
    const product = scrapedProducts[0];
    console.log("Processing single product:", product);

    if (product) {
      try {
        results.scraping.totalProcessed++;

        // Tarkista onko tuote jo tietokannassa
        const existingProduct = await getProductById(product.id);

        let productWithMetadata: ScrapedProduct & { metadata: ProductMetadata };

        if (!existingProduct) {
          // Uusi tuote: tehdään analyysi
          console.log(`Analyzing new product: ${product.name}`);
          const metadata = await analyzeProduct(product);
          productWithMetadata = {
            ...product,
            metadata: metadata || {
              style: "",
              materials: [],
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
          // Olemassa oleva tuote: käytetään vanhaa metadataa
          console.log(`Using existing metadata for product: ${product.name}`);
          productWithMetadata = {
            ...product,
            metadata: existingProduct.metadata,
          };
        }

        // Prepare and save to database
        const preparedProduct = await prepareProductForDB(productWithMetadata);

        const upsertResult = await upsertProduct(preparedProduct);

        // Jos upsertResult on null, mitään ei päivitetty
        if (upsertResult !== null) {
          results.scraping.successful++;
          results.products.push({
            id: product.id,
            name: product.name,
            status: "success",
            action: existingProduct ? "updated" : "created",
          });
        } else {
          results.products.push({
            id: product.id,
            name: product.name,
            status: "skipped",
            message: "No changes detected",
          });
        }
      } catch (error) {
        results.scraping.failed++;

        const processedProduct: ProcessedProduct = {
          id: product.id,
          name: product.name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };

        results.products.push(processedProduct);
        results.scraping.errors.push(
          `Error processing ${product.name}: ${processedProduct.error}`
        );

        console.error(`Error processing product ${product.name}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error("Pipeline error:", error);
    throw error;
  }
}
