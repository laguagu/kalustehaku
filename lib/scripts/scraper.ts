/* eslint-disable @typescript-eslint/no-unused-vars */
// scripts/scraper.ts
import fs from "fs";
import path from "path";
import puppeteer, { ElementHandle } from "puppeteer";
import { ScrapedProduct } from "../types";

// Helper function to convert thumbnail URL to big image URL
function convertToBigImageUrl(url: string): string {
  return url.replace("/images_thumb/", "/images_thumb_big/");
}

async function safeGetProductUrl(
  element: ElementHandle,
): Promise<string | null> {
  try {
    const url = await element.$eval(".nimi a", (el) => {
      const href = el.getAttribute("href");
      return href ? `https://www.tavaratrading.com${href}` : null;
    });
    return url;
  } catch (error) {
    console.error("Error getting product URL:", error);
    return null;
  }
}

// Helper function to safely get element text
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
    return null;
  }
}

// Helper function to safely get element attribute
async function safeGetAttribute(
  element: ElementHandle,
  selector: string,
  attribute: string,
): Promise<string | null> {
  try {
    const el = await element.$(selector);
    if (!el) return null;
    const value = await element.$eval(
      selector,
      (el, attr) => {
        // Tarkista ensin data-src attribuutti
        const dataSrc = el.getAttribute("data-src");
        if (dataSrc) {
          const url = `https://www.tavaratrading.com` + dataSrc;
          return url;
        }
        // Jos data-src ei löydy, käytä normaalia src
        return el.getAttribute(attr) || "";
      },
      attribute,
    );
    return value;
  } catch (error) {
    console.error("Error getting attribute:", error);
    return null;
  }
}

// Helper function to safely parse price
function safeParsePrice(priceText: string | null): number | null {
  try {
    if (!priceText) return null;
    const number = parseFloat(
      priceText.replace(/[^0-9.,]/g, "").replace(",", "."),
    );
    return isNaN(number) ? null : number;
  } catch (error) {
    return null;
  }
}
// Scrapes only used products from the given URL
export async function scrapeProducts(url: string): Promise<ScrapedProduct[]> {
  try {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle0" });

    await page.waitForSelector("#items_per_page");

    console.log('Selecting "Show All" option...');
    await page.select("#items_per_page", "all");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    const products: ScrapedProduct[] = [];

    console.log("Scraping products...");
    const productElements = await page.$$(".product_list_wrapper .listatuote");
    console.log(`Found ${productElements.length} products on page`);

    for (const element of productElements) {
      try {
        const isUsed = (await element.$(".kunto.used")) !== null;
        const name = await safeGetText(element, ".nimi a");

        if (!isUsed || !name) {
          continue;
        }

        // Haetaan tuotteen URL
        const productUrl = await safeGetProductUrl(element);

        // Hae kuvan URL uudella tavalla
        const imageUrl = await element
          .$eval(".kuva img", (img) => {
            const dataSrc = img.getAttribute("data-src");
            if (dataSrc) {
              return `https://www.tavaratrading.com${dataSrc}`;
            }
            const src = img.getAttribute("src");
            return src
              ? src.startsWith("http")
                ? src
                : `https://www.tavaratrading.com${src}`
              : "";
          })
          .catch(() => "");

        const bigImageUrl = convertToBigImageUrl(imageUrl);

        const product: ScrapedProduct = {
          id:
            (await safeGetAttribute(element, ".kuva a", "name"))?.replace(
              "product_",
              "",
            ) || "",
          name,
          description: await safeGetText(element, ".subtitle"),
          price: safeParsePrice(await safeGetText(element, ".price_out")),
          condition: (await safeGetText(element, ".kunto")) || "",
          imageUrl: bigImageUrl,
          category: url.split("/").pop() || "",
          availability: (await safeGetText(element, ".availability p")) || "",
          productUrl: productUrl || "",
        };

        if (product.id && product.name) {
          products.push(product);
        } else {
          console.log("Skipping product due to missing required fields");
        }
      } catch (error) {
        console.error("Error processing product:", error);
      }
    }

    await browser.close();
    return products;
  } catch (error) {
    console.error("Error scraping products:", error);
    return [];
  }
}

const TEST_URL =
  "https://www.tavaratrading.com/toimistokalusteet/194/korkeat-poydat-ja-tuolit";

export async function main() {
  try {
    const products = await scrapeProducts(TEST_URL);

    // Save results to a JSON file
    const outputPath = path.join(process.cwd(), "scraped-products.json");
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
