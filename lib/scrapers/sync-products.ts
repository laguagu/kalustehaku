import {
  PipelineResults,
  ProcessedProduct,
  ScrapedProduct,
} from "@/lib/types/products/types";
import { findRemovedProducts, removeProducts } from "../db/queries";

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
      // Uusi logiikka Tavara-Trading URL:eille
      const urlObject = new URL(url);
      const pathParts = urlObject.pathname.split("/");
      // Etsitään "kaytetyt-" alkuinen osa ja poistetaan "kaytetyt-" etuliite
      const categoryPart = pathParts.find((part) =>
        part.startsWith("kaytetyt-"),
      );
      if (categoryPart) {
        return categoryPart.replace("kaytetyt-", "");
      }
      // Jos ei löydy "kaytetyt-" alkuista osaa, käytetään toiseksi viimeistä osaa
      return pathParts[pathParts.length - 2] || "";
    }
    return url;
  } catch (e) {
    console.error("Error parsing URL:", e);
    return url;
  }
}

function normalizeCategory(category: string): string {
  // Poistetaan "kaytetyt-" etuliite jos se on
  const withoutPrefix = category.replace(/^kaytetyt-/, "");

  // Poistetaan numerot ja muut ylimääräiset merkit kategorian lopusta
  // ja muutetaan kaikki väliviivat yhdeksi väliviivaksi
  return withoutPrefix
    .toLowerCase()
    .trim()
    .replace(/-+/g, "-") // Korvataan useat väliviivat yhdellä
    .replace(/-ja-/g, "-") // Korvataan "-ja-" väliviivalla
    .split("-")[0]; // Otetaan vain ensimmäinen osa
}

export async function syncProducts(
  scrapedProducts: ScrapedProduct[],
  options: SyncOptions,
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
      options.urls
        .map((url) => getUrlCategory(url, options.company))
        .map((category) => normalizeCategory(category)),
    );

    // Hae scrapatut kategoriat tuotteista
    const scrapedCategories = new Set(
      scrapedProducts.map((product) => normalizeCategory(product.category)),
    );

    console.log(`Expected URLs: ${options.urls.length}`);
    console.log(`Found products from URLs: ${scrapedProducts.length}`);
    console.log(`Expected categories: ${Array.from(urlCategories).join(", ")}`);
    console.log(
      `Found categories: ${Array.from(scrapedCategories).join(", ")}`,
    );
    console.log(`Total scraped products: ${scrapedProducts.length}`);

    // Tarkista puuttuvat kategoriat
    const missingCategories = Array.from(urlCategories).filter(
      (urlCategory) => !scrapedCategories.has(urlCategory),
    );

    // Jos kategorioita puuttuu, älä poista tuotteita
    if (missingCategories.length > 0) {
      const errorMessage = `Missing categories: ${missingCategories.join(", ")}`;
      console.warn(`Warning: ${errorMessage}`);
      syncResults.scraping.errors.push(errorMessage);
      return syncResults;
    }

    // Jos kaikki kategoriat löytyvät, etsi poistettavat tuotteet
    const removedProducts = await findRemovedProducts(
      options.company,
      options.isTestData || false,
      scrapedIds,
    );

    // Poista tuotteet jotka eivät ole enää saatavilla
    if (removedProducts.length > 0) {
      console.log(`Found ${removedProducts.length} products to remove`);

      await removeProducts(
        removedProducts.map((product) => ({
          id: product.id,
          name: product.name,
        })),
        options.company,
      );

      // Lisää poistetut tuotteet tuloksiin
      syncResults.removedProducts = removedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        status: "success" as const,
        action: "deleted" as const,
        message: "Product no longer available",
      }));

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
