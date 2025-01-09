/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScrapedProduct, ScraperConfig } from "@/lib/types/products/types";
import fs from "fs";
import path from "path";
import puppeteer, { Browser, ElementHandle, Page } from "puppeteer-core";

const getBrowserOptions = () => ({
  executablePath:
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === "win32"
      ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : "/usr/bin/chromium-browser"),
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process",
    `--crash-dumps-dir=/tmp/chrome-crashpad-database`,
  ],
  env: {
    CHROME_CRASHPAD_DATABASE_DIR: "/tmp/chrome-crashpad-database",
  },
});

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

export async function scrapeProducts(
  url: string,
  config: ScraperConfig,
): Promise<ScrapedProduct[]> {
  let browser: Browser | null = null;
  let page: Page | null = null;
  const products: ScrapedProduct[] = [];

  // RetryOperation määritys scrapeProducts funktion sisällä
  async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 3000,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(
          `Operation failed (Attempt ${i + 1}/${maxRetries}):`,
          error,
        );

        const needsReinit =
          error instanceof Error &&
          (error.message.includes("Target closed") ||
            error.message.includes("Protocol error") ||
            error.message.includes("detached Frame") ||
            error.message.includes("Session closed"));

        if (needsReinit) {
          console.log("Browser session closed or detached, reinitializing...");

          if (page) await page.close().catch(() => {});
          if (browser) await browser.close().catch(() => {});

          // Reinitialize browser
          browser = await puppeteer.launch(getBrowserOptions());

          page = await browser.newPage();

          // Re-navigate to the original URL and set up page
          await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
          await page.waitForSelector("#items_per_page", { timeout: 30000 });

          // Re-select "Show All" option
          await page.select("#items_per_page", "all");
          await page.waitForNavigation({
            waitUntil: "networkidle0",
            timeout: 60000,
          });

          // Give extra time for the page to stabilize
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        if (i < maxRetries - 1) {
          const waitTime = retryDelay * Math.pow(2, i);
          console.log(`Retrying in ${waitTime / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
    throw new Error("Operation failed after all retries");
  }

  try {
    console.log("Launching browser...");
    browser = await retryOperation(async () => {
      const browser = await puppeteer.launch(getBrowserOptions());
      return browser;
    });

    page = await browser.newPage();
    console.log(`Navigating to ${url}...`);

    // Initial setup
    await retryOperation(async () => {
      await page!.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
      await page!.waitForSelector("#items_per_page", { timeout: 30000 });
      await page!.select("#items_per_page", "all");
      await page!.waitForNavigation({
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      // Give extra time for the page to stabilize
      await new Promise((resolve) => setTimeout(resolve, 5000));
    });

    // Wrap product scraping in retry
    await retryOperation(async () => {
      console.log("Scraping products...");
      const productElements = await page!.$$(
        ".product_list_wrapper .listatuote",
      );
      console.log(`Found ${productElements.length} products on page`);

      if (productElements.length === 0) {
        throw new Error("No products found on page");
      }

      for (const element of productElements) {
        try {
          const isUsed = (await element.$(".kunto.used")) !== null;
          const name = await safeGetText(element, ".nimi a");

          if (!isUsed || !name) {
            continue;
          }

          const product = await retryOperation(async () => {
            const productUrl = await safeGetProductUrl(element);
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

            const bigImageUrl = imageUrl ? convertToBigImageUrl(imageUrl) : "";

            return {
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
              availability:
                (await safeGetText(element, ".availability p")) || "",
              productUrl: productUrl || "",
              company: config.company,
            } as ScrapedProduct;
          });

          if (product.id && product.name) {
            products.push(product);
          }
        } catch (error) {
          console.error("Error processing product:", error);
        }
      }
    });

    console.log(`Successfully scraped ${products.length} products`);
    return products;
  } catch (error) {
    console.error("Error scraping products:", error);
    return products;
  } finally {
    if (browser) {
      try {
        await browser.close().catch(() => {});
        console.log("Browser closed successfully");
      } catch (error) {
        console.error("Error closing browser:", error);
      }
    }
  }
}

export async function main() {
  const TEST_URL =
    // "https://www.tavaratrading.com/toimistokalusteet/189/sohvapoydat-pikku-poydat-ja-jakkarat";
    // "https://www.tavaratrading.com/toimistokalusteet/29/sohvat-nojatuolit-penkit-ja-rahit/kaytetyt-sohvat-nojatuolit-ja-rahit"
    "https://www.tavaratrading.com/toimistokalusteet/13/sohvat-nojatuolit-penkit-ja-rahit";
  try {
    const products = await scrapeProducts(TEST_URL, {
      company: "Tavara-Trading",
    });

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

if (require.main === module) {
  main();
}
