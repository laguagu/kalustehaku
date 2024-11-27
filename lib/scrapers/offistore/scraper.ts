// lib/scrapers/offistore/scraper.ts
import { ScrapedProduct, ScraperConfig } from "@/lib/types/products/types";
import fs from "fs";
import path from "path";
import puppeteer, { ElementHandle } from "puppeteer";

// Helper functions
async function safeGetText(
  element: ElementHandle,
  selector: string,
): Promise<string | null> {
  try {
    const el = await element.$(selector);
    if (!el) return null;
    const text = await element.$eval(
      selector,
      (el) => el.textContent?.trim() || "",
    );
    return text;
  } catch (error) {
    console.warn("Error in safeGetText:", error);
    return null;
  }
}

function safeParsePrice(priceText: string | null): number | null {
  try {
    if (!priceText) return null;
    // Poista "Alk.", "€", "+" ja "alv" tekstit ja muunna pilkku pisteeksi
    const cleanPrice = priceText
      .replace(/Alk\.|€|\+|alv/g, "")
      .replace(",", ".")
      .trim();
    const number = parseFloat(cleanPrice);
    return isNaN(number) ? null : number;
  } catch (error) {
    console.warn("Error parsing price:", error);
    return null;
  }
}

export async function scrapeProducts(
  url: string,
  config: ScraperConfig,
): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const processedUrls = new Set<string>();

  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    async function processPage(pageUrl: string) {
      if (processedUrls.has(pageUrl)) return;
      processedUrls.add(pageUrl);

      console.log(`Navigating to ${pageUrl}...`);
      await page.goto(pageUrl, { waitUntil: "networkidle0" });

      console.log("Scraping products...");
      const productElements = await page.$$(".product.card");
      console.log(`Found ${productElements.length} products on page`);

      for (const element of productElements) {
        try {
          // Get product URL and ID
          const productUrl = await element.$eval("h4 a", (el) => {
            const href = el.getAttribute("href");
            return href ? `https://offistore.fi${href}` : "";
          });

          const id = productUrl.split("-p-")[1]?.split("-")[0] || "";

          // Get product name
          const name = await safeGetText(element, "h4 a");

          // Get brand/var (small element before h4)
          const brand = await safeGetText(element, "small.var");

          // Get description (small element after h4)
          const description = await safeGetText(
            element,
            ".card-body small.font-weight-medium",
          );

          // Get image URL
          const imageUrl = await element.$eval(".card-image img", (img) => {
            const src = img.getAttribute("src");
            return src ? `https://offistore.fi${src}` : "";
          });

          // Get price
          const priceText = await safeGetText(element, ".h5");
          const price = safeParsePrice(priceText);

          // Get availability
          const availability = await safeGetText(
            element,
            ".text-sm.d-flex.row .col-auto.col-sm-4.col-md-3",
          );

          // Create product object
          const product: ScrapedProduct = {
            id,
            name: name || "",
            description: description || brand || null,
            price,
            condition: "Käytetty",
            imageUrl,
            category: url.split("/").pop() || "",
            availability: availability?.trim() || "",
            productUrl,
            company: config.company,
          };

          if (product.id && product.name) {
            products.push(product);
          }
        } catch (error) {
          console.error("Error processing product:", error);
        }
      }

      // Check for next page
      const nextPageLink = await page.$("li.page-item a[rel='next']");
      if (nextPageLink) {
        const nextPageUrl = await page.$eval(
          "li.page-item a[rel='next']",
          (el) => {
            const href = el.getAttribute("href");
            return href ? `https://offistore.fi${href}` : null;
          },
        );
        if (nextPageUrl && !processedUrls.has(nextPageUrl)) {
          await processPage(nextPageUrl);
        }
      }
    }

    // Start processing from the first page
    await processPage(url);
    await browser.close();

    return products;
  } catch (error) {
    console.error("Error scraping products:", error);
    return products;
  }
}

export async function main() {
  const TEST_URL =
    //   "https://offistore.fi/verkkokauppa/fin/neuvottelutuolit-118";
    //   "https://offistore.fi/verkkokauppa/fin/poydat-73";
    "https://offistore.fi/verkkokauppa/fin/aulakalusteet-93";
  try {
    const products = await scrapeProducts(TEST_URL, { company: "OffiStore" });

    // Save results to a JSON file
    const outputPath = path.join(
      process.cwd(),
      "scraped-products-OffiStore.json",
    );
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

    console.log(`\nScraping completed:`);
    console.log(`- Total products found: ${products.length}`);
    console.log(`- Results saved to: ${outputPath}`);

    if (products.length > 0) {
      console.log("\nExample of first product:");
      console.log(JSON.stringify(products[0], null, 2));
    }
  } catch (error) {
    console.error("Error in main:", error);
  }
}

// Suoritetaan main funktio vain jos tiedosto ajetaan suoraan
if (require.main === module) {
  main();
}
