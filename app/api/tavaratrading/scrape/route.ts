// api/tavaratrading/scrape/route.ts
import { processOffiStore } from "@/lib/scrapers/offistore";
import { processTavaraTrading } from "@/lib/scrapers/tavaratrading";
import { ScraperOptions } from "@/lib/types/products/types";
import { NextResponse } from "next/server";

const scrapers = {
  tavaratrading: processTavaraTrading,
  offistore: processOffiStore,
};

const basicAuth = async (request: Request) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "utf-8",
  );
  const [username, password] = credentials.split(":");

  if (
    username !== process.env.SCRAPER_USERNAME ||
    password !== process.env.SCRAPER_PASSWORD
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return null;
};

async function runProcessing(options: ScraperOptions) {
  const startTime = Date.now();
  const processType = options.isCron ? "CRON" : "Manual";
  const dataType = options.isTestData ? "TEST" : "PRODUCTION";

  console.log(
    `[${processType} ${dataType} Processing] Starting at ${new Date().toISOString()}`,
  );
  console.log(`Company: ${options.company}`);
  console.log(`URLs to process: ${options.urls?.length || "default"}`);
  console.log(`Products per URL: ${options.productsPerUrl}`);

  try {
    const processFunction =
      scrapers[options.company.toLowerCase() as keyof typeof scrapers];
    if (!processFunction) {
      throw new Error(`Invalid scraper specified: ${options.company}`);
    }

    const results = await processFunction(options);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[${processType} Processing] Completed in ${duration}s`);
    console.log(`Processed: ${results.scraping.totalProcessed}`);
    console.log(`Successful: ${results.scraping.successful}`);
    console.log(`Failed: ${results.scraping.failed}`);

    return results;
  } catch (error) {
    console.error(`[${processType} Processing] Failed:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const authResponse = await basicAuth(request);
    if (authResponse) return authResponse;

    const body = await request.json().catch(() => ({}));
    const {
      company = "tavaratrading",
      urls,
      productsPerUrl,
      isTestData = true,
      isCron = false,
    } = body;

    const results = await runProcessing({
      company,
      urls,
      productsPerUrl,
      isTestData,
      isCron,
    });

    return NextResponse.json({
      success: true,
      data: results,
      company,
      isTestData,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
