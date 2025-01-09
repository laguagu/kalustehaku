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
    `--crash-dumps-dir=/tmp/chrome-crashpad-database`, // Vaihtoehtoisesti käytä dir=/dev/null jolloin ne menevät mustaan aukkoon
  ],
  env: {
    CHROME_CRASHPAD_DATABASE_DIR: "/tmp/chrome-crashpad-database",
  },
});

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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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

  async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 3000,
  ): Promise<T> {
    let currentUrl = "";

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.error(
          `Operation failed (Attempt ${i + 1}/${maxRetries}):`,
          error,
        );

        // Tallenna nykyinen URL ennen selaimen sulkemista
        if (page) {
          try {
            currentUrl = await page.url();
            console.log(`Saved current URL: ${currentUrl}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            console.log("Could not get current URL");
          }
        }

        const needsReinit =
          error instanceof Error &&
          (error.message.includes("Target closed") ||
            error.message.includes("Protocol error") ||
            error.message.includes("detached Frame") ||
            error.message.includes("Session closed"));

        if (needsReinit) {
          console.log("Browser session closed or detached, reinitializing...");

          // Sulje vanhat instanssit
          if (page) await page.close().catch(() => {});
          if (browser) await browser.close().catch(() => {});

          // Alusta uusi selain ja sivu
          browser = await puppeteer.launch(getBrowserOptions());

          if (browser) {
            page = await setupPage(browser);
          }

          // Jos meillä on URL tallessa, navigoi takaisin siihen
          if (currentUrl && page) {
            console.log(`Navigating back to: ${currentUrl}`);
            await page.goto(currentUrl, {
              waitUntil: ["load", "domcontentloaded", "networkidle0"],
              timeout: 60000,
            });
            // Anna sivulle aikaa latautua kunnolla
            await delay(5000);
          }
        }

        if (i < maxRetries - 1) {
          const waitTime = retryDelay * Math.pow(2, i);
          console.log(`Retrying in ${waitTime / 1000} seconds...`);
          await delay(waitTime);
        } else {
          throw error;
        }
      }
    }
    throw new Error("Operation failed after all retries");
  }

  async function waitForProducts(
    page: Page,
    maxAttempts = 5,
  ): Promise<ElementHandle<Element>[]> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Log the current URL to debug
        console.log(`Current page URL: ${await page.url()}`);

        // Wait for main content to load
        await page.waitForSelector("main#main", { timeout: 5000 });

        // Scroll the page
        await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise((r) => setTimeout(r, 1000));
          window.scrollTo(0, 0);
        });

        await delay(2000);

        // Check if we're on a valid page by looking at the product count text
        const productCountText = await page
          .$eval("nav.navbar p.font-weight-medium", (el) => el.textContent)
          .catch(() => null);

        console.log("Product count text:", productCountText);

        // Get product elements
        const elements = await page.$$("div.product.card");
        console.log(`Found ${elements.length} product elements`);

        if (elements.length > 0) {
          return elements;
        }

        // Check pagination specifically
        const paginationExists = await page.evaluate(() => {
          const pagination = document.querySelector("ul.pagination");
          const currentPage = document.querySelector("ul.pagination li.active");
          return {
            exists: !!pagination,
            currentPage: currentPage ? currentPage.textContent?.trim() : null,
            html: pagination?.outerHTML,
          };
        });

        console.log("Pagination status:", paginationExists);

        // If we have pagination but no products, something's wrong
        if (paginationExists.exists && elements.length === 0) {
          console.log(
            "Found pagination but no products, this might be a loading issue",
          );
          // Try waiting a bit longer
          await delay(3000);
          continue;
        }

        // If we have neither products nor pagination, check for error state
        const errorElement = await page.$(".alert.alert-danger");
        if (errorElement) {
          const errorText = await page.evaluate(
            (el) => el.textContent,
            errorElement,
          );
          throw new Error(`Page error detected: ${errorText}`);
        }

        console.log(
          `Attempt ${i + 1}/${maxAttempts}: No products found yet, waiting...`,
        );
        await delay(3000);
      } catch (error) {
        console.error(`Error in waitForProducts attempt ${i + 1}:`);
        if (i === maxAttempts - 1) throw error;
        await delay(2000);
      }
    }

    // Take a screenshot before giving up
    try {
      await page.screenshot({ path: "error-page.png", fullPage: true });
      console.log("Error page screenshot saved as error-page.png");

      // Also save the page HTML for debugging
      const html = await page.content();
      fs.writeFileSync("error-page.html", html);
      console.log("Error page HTML saved as error-page.html");
    } catch (e) {
      console.log("Failed to save error data:", e);
    }

    throw new Error("No products found on page after multiple attempts");
  }

  async function processPage(pageUrl: string, retryCount = 0): Promise<void> {
    const MAX_PAGE_RETRIES = 3;

    if (processedUrls.has(pageUrl)) {
      console.log(`Skipping already processed URL: ${pageUrl}`);
      return;
    }

    console.log(
      `Processing URL: ${pageUrl} (Attempt ${retryCount + 1}/${MAX_PAGE_RETRIES + 1})`,
    );

    try {
      // Jos selain on kiinni, käynnistä se uudestaan
      if (!browser || !page) {
        console.log("Browser not initialized, starting new session...");
        if (browser) await browser.close().catch(() => {});

        browser = await puppeteer.launch(getBrowserOptions());
        page = await setupPage(browser!);
      }

      // Navigate to page with longer timeout
      await retryOperation(async () => {
        const response = await page!.goto(pageUrl, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: 60000,
        });

        if (!response || !response.ok()) {
          throw new Error(
            `Failed to load page: ${response ? response.status() : "No response"}`,
          );
        }

        // Varmista että sivu on latautunut kunnolla
        await page!.waitForFunction(
          () => {
            // Tarkista että joko tuotteita tai sivutus on näkyvissä
            return (
              document.querySelector(".product.card") !== null ||
              document.querySelector("ul.pagination") !== null
            );
          },
          { timeout: 30000 },
        );

        await delay(5000); // Lisäviive

        // Yritä vierittää sivu näkyviin osissa
        await page!.evaluate(async () => {
          const totalHeight = document.body.scrollHeight;
          const viewportHeight = window.innerHeight;
          const steps = Math.ceil(totalHeight / viewportHeight);

          for (let i = 0; i <= steps; i++) {
            window.scrollTo(0, i * viewportHeight);
            await new Promise((r) => setTimeout(r, 500));
          }
          // Vieritä takaisin ylös
          window.scrollTo(0, 0);
        });

        // Verify page loaded correctly
        const url = page!.url();
        if (!url.includes(pageUrl)) {
          throw new Error(`Page redirected unexpectedly to ${url}`);
        }
      });

      await simulateHumanBehavior(page!);

      // Get products with improved waiting logic
      const productElements = await retryOperation(async () => {
        const elements = await waitForProducts(page!);
        return elements;
      });

      console.log(
        `Found ${productElements.length} products on page ${pageUrl}`,
      );

      // Process each product
      for (const element of productElements) {
        try {
          const product = await retryOperation(async () => {
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

            const categoryMatch = pageUrl.match(/\/fin\/([^/?]+)/);
            const category = categoryMatch ? categoryMatch[1] : "";

            return {
              id,
              name: name || "",
              description: description || brand || null,
              price,
              condition: "Käytetty",
              imageUrl,
              category,
              availability: availability?.trim() || "",
              productUrl,
              company: config.company,
            } as ScrapedProduct;
          });

          if (product.id && product.name) {
            products.push(product);
          }

          await delay(randomDelay(100, 300));
        } catch (error) {
          console.error("Error processing product:", error);
        }
      }

      // Mark current URL as processed before checking next page
      processedUrls.add(pageUrl);

      // Check for next page with improved detection
      const nextPageUrl = await retryOperation(async () => {
        const data = await page!.evaluate(() => {
          const nextLink = document.querySelector(
            'li.page-item a[rel="next"]',
          ) as HTMLAnchorElement;
          if (
            nextLink &&
            window.getComputedStyle(nextLink).display !== "none"
          ) {
            return {
              href: nextLink.getAttribute("href"),
              text: nextLink.textContent?.trim(),
            };
          }
          return null;
        });

        if (data?.href) {
          return `https://offistore.fi${data.href}`;
        }
        return null;
      }).catch(() => null);

      if (nextPageUrl && !processedUrls.has(nextPageUrl)) {
        console.log(`Found next page: ${nextPageUrl}`);
        await delay(randomDelay(4000, 7000));
        // Seuraavalla sivulla aloitetaan uusista yrityksistä
        await processPage(nextPageUrl, 0);
      } else {
        console.log("No more pages to process");
      }
    } catch (error) {
      console.error(`Error processing page ${pageUrl}:`, error);

      // Jos sivu epäonnistuu ja yrityksiä on jäljellä, yritä uudelleen puhtaalla selaimella
      if (retryCount < MAX_PAGE_RETRIES) {
        console.log(
          `Retrying page ${pageUrl} in 10 seconds... (Attempt ${retryCount + 1}/${MAX_PAGE_RETRIES})`,
        );
        await delay(10000);

        // Sulje nykyinen selain ja sivu
        if (page) await page.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
        browser = null;
        page = null;

        // Yritä sivua uudelleen
        return processPage(pageUrl, retryCount + 1);
      } else {
        console.error(
          `Failed to process page ${pageUrl} after ${MAX_PAGE_RETRIES + 1} attempts`,
        );
      }
    }
  }

  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch(getBrowserOptions());

    page = await setupPage(browser!);
    await processPage(url); // Tässä kutsutaan processPage funktiota
    console.log(`Scraped ${products.length} products in total`);
    return products;
  } catch (error) {
    console.error("Error scraping products:", error);
    return products;
  } finally {
    try {
      if (page) await page.close().catch(() => {});
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
  const TEST_URL = "https://offistore.fi/verkkokauppa/fin/tuolit-78";

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
