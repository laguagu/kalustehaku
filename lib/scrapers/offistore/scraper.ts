import { ScrapedProduct, ScraperConfig } from "@/lib/types/products/types";
import fs from "fs";
import path from "path";
import { Browser, ElementHandle, Page } from "puppeteer";
import puppeteer from "puppeteer-extra";

// Helper functions
function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function setupPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Set realistic viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Set common headers
  await page.setExtraHTTPHeaders({
    "Accept-Language": "fi-FI,fi;q=0.9,en-US;q=0.8,en;q=0.7",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Cache-Control": "max-age=0",
  });

  // Set a realistic user agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  // Set longer timeouts
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);

  return page;
}

async function simulateHumanBehavior(page: Page) {
  // Random scroll
  await page.evaluate(() => {
    const scrollAmount = Math.floor(Math.random() * 100) + 50;
    window.scrollBy(0, scrollAmount);
  });

  // Random mouse movements
  const x = Math.floor(Math.random() * 500);
  const y = Math.floor(Math.random() * 500);
  await page.mouse.move(x, y);

  await delay(randomDelay(500, 1500));
}

export async function scrapeProducts(
  url: string,
  config: ScraperConfig,
): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  const processedUrls = new Set<string>();
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    page = await setupPage(browser);

    async function processPage(pageUrl: string, retryCount = 0): Promise<void> {
      const MAX_RETRIES = 3;

      try {
        if (processedUrls.has(pageUrl)) return;
        processedUrls.add(pageUrl);

        console.log(
          `Navigating to ${pageUrl}... (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`,
        );

        // Navigate with additional wait states
        await page!.goto(pageUrl, {
          waitUntil: ["load", "domcontentloaded", "networkidle0"],
          timeout: 30000,
        });

        // Wait random time and simulate human behavior
        await delay(randomDelay(2000, 4000));
        await simulateHumanBehavior(page!);

        // Wait for products with retry
        let productElements: ElementHandle<Element>[] = [];
        for (let i = 0; i < 3; i++) {
          productElements = await page!.$$(".product.card");
          if (productElements.length > 0) break;
          await delay(1000);
        }

        console.log(`Found ${productElements.length} products on page`);

        for (const element of productElements) {
          try {
            const productUrl = await element.$eval("h4 a", (el) => {
              const href = el.getAttribute("href");
              return href ? `https://offistore.fi${href}` : "";
            });

            const id = productUrl.split("-p-")[1]?.split("-")[0] || "";
            const name = await safeGetText(element, "h4 a");
            const brand = await safeGetText(element, "small.var");
            const description = await safeGetText(
              element,
              ".card-body small.font-weight-medium",
            );
            const imageUrl = await element.$eval(".card-image img", (img) => {
              const src = img.getAttribute("src");
              return src ? `https://offistore.fi${src}` : "";
            });
            const priceText = await safeGetText(element, ".h5");
            const price = safeParsePrice(priceText);
            const availability = await safeGetText(
              element,
              ".text-sm.d-flex.row .col-auto.col-sm-4.col-md-3",
            );

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

            // Random delay between products
            await delay(randomDelay(100, 300));
          } catch (error) {
            console.error("Error processing product:", error);
          }
        }

        // Check for next page with retry
        let nextPageUrl = null;
        try {
          const nextPageLink = await page!.$("li.page-item a[rel='next']");
          if (nextPageLink) {
            nextPageUrl = await page!.$eval(
              "li.page-item a[rel='next']",
              (el) => {
                const href = el.getAttribute("href");
                return href ? `https://offistore.fi${href}` : null;
              },
            );
          }
        } catch (error) {
          console.log("No next page found", error);
        }

        if (nextPageUrl && !processedUrls.has(nextPageUrl)) {
          // Longer random delay between pages
          await delay(randomDelay(4000, 7000));
          await processPage(nextPageUrl, 0);
        }
      } catch (error) {
        console.error(
          `Error processing page (Attempt ${retryCount + 1}):`,
          error,
        );

        if (retryCount < MAX_RETRIES) {
          // Exponential backoff
          const retryDelay = Math.pow(2, retryCount) * 3000;
          await delay(retryDelay);
          return processPage(pageUrl, retryCount + 1);
        }
      }
    }

    await processPage(url);
    return products;
  } catch (error) {
    console.error("Error scraping products:", error);
    return products;
  } finally {
    try {
      if (page) {
        await page.close().catch(() => {});
      }
      if (browser) {
        console.log("Closing browser...");
        await browser.close().catch(() => {});
      }
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }
}
export async function main() {
  // const TEST_URL = "https://offistore.fi/verkkokauppa/fin/tuolit-78";
  const TEST_URL = "https://offistore.fi/verkkokauppa/fin/tuolit-78?p=4";

  try {
    const products = await scrapeProducts(TEST_URL, { company: "OffiStore" });

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
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}
