import { db } from "@/lib/db/drizzle";
import { products } from "@/lib/db/schema";
import {
    PipelineResults,
    ProcessedProduct,
    ScrapedProduct,
} from "@/lib/types/products/types";
import { and, eq, notInArray } from "drizzle-orm";

interface SyncOptions {
  company: string;
  urls: string[];
  isTestData?: boolean;
}

interface SyncResult extends PipelineResults {
  removedProducts: ProcessedProduct[];
}

function getUrlCategory(url: string, company: string): string {
  try {
    if (company === "OffiStore") {
      const match = url.match(/\/fin\/([^/?]+)/);
      return match ? match[1] : "";
    } else if (company === "Tavara-Trading") {
      const parts = new URL(url).pathname.split("/");
      return parts[3] || "";
    }
    return url;
  } catch (e) {
    console.error("Error parsing URL:", e);
    return url;
  }
}

function normalizeCategory(category: string): string {
  // Poista numerot ja muut ylimääräiset merkit kategorian lopusta
  return category.split("-")[0].toLowerCase().trim();
}

export async function syncProducts(
  scrapedProducts: ScrapedProduct[],
  options: SyncOptions
): Promise<SyncResult> {
  const scrapedIds = scrapedProducts.map((product) => product.id);

  const syncResults: SyncResult = {
    scraping: {
      totalProcessed: scrapedProducts.length,
      successful: scrapedProducts.length,
      failed: 0,
      errors: [],
    },
    products: [],
    removedProducts: [],
  };

  try {
    // Hae odotetut kategoriat URL:eista
    const urlCategories = new Set(
      options.urls.map((url) => getUrlCategory(url, options.company))
    );

    // Hae scrapatut kategoriat tuotteista
    const scrapedCategories = new Set(
      scrapedProducts.map((product) => normalizeCategory(product.category))
    );

    console.log(`Expected URLs: ${options.urls.length}`);
    console.log(`Found products from URLs: ${scrapedProducts.length}`);
    console.log(
      `Expected categories: ${Array.from(urlCategories)
        .map((cat) => normalizeCategory(cat))
        .join(", ")}`
    );
    console.log(
      `Found categories: ${Array.from(scrapedCategories).join(", ")}`
    );
    console.log(`Total scraped products: ${scrapedProducts.length}`);

    // Tarkista puuttuvat kategoriat
    const missingCategories = Array.from(urlCategories).filter(
      (urlCategory) => {
        const normalizedUrlCategory = normalizeCategory(urlCategory);
        return !Array.from(scrapedCategories).some(
          (scrapedCat) => scrapedCat === normalizedUrlCategory
        );
      }
    );

    // Jos kategorioita puuttuu, älä poista tuotteita
    if (missingCategories.length > 0) {
      const errorMessage = `Missing categories: ${missingCategories.join(", ")}`;
      console.warn(`Warning: ${errorMessage}`);
      syncResults.scraping.errors.push(errorMessage);
      return syncResults;
    }

    // Jos kaikki kategoriat löytyvät, etsi poistettavat tuotteet
    const removedProducts = await db.query.products.findMany({
      where: and(
        eq(products.company, options.company),
        eq(products.isTestData, options.isTestData || false),
        notInArray(products.id, scrapedIds)
      ),
    });

    // Poista tuotteet jotka eivät ole enää saatavilla
    if (removedProducts.length > 0) {
      console.log(`Found ${removedProducts.length} products to remove`);

      for (const product of removedProducts) {
        await db
          .delete(products)
          .where(
            and(
              eq(products.id, product.id),
              eq(products.company, options.company)
            )
          );

        syncResults.removedProducts.push({
          id: product.id,
          name: product.name,
          status: "success",
          action: "deleted",
          message: "Product no longer available",
        });
      }

      console.log(`Successfully removed ${removedProducts.length} products`);
    } else {
      console.log("No products to remove");
    }

    return syncResults;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    syncResults.scraping.errors.push(`Sync error: ${errorMessage}`);
    console.error("Product sync failed:", error);
    return syncResults;
  }
}
