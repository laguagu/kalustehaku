import { processProducts, PRODUCT_URLS } from "@/lib/product-pipeline";
import { NextResponse } from "next/server";

// Basic auth middleware
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

// Verify CRON request
const verifyCron = (request: Request) => {
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

// Process helper with logging
async function runProcessing(options?: {
  urls?: string[];
  productsPerUrl?: number;
  isCron?: boolean;
}) {
  const startTime = Date.now();
  const processType = options?.isCron ? "CRON" : "Manual";

  console.log(
    `[${processType} Processing] Starting at ${new Date().toISOString()}`,
  );
  console.log(
    `URLs to process: ${options?.urls?.length || PRODUCT_URLS.length}`,
  );
  console.log(`Products per URL: ${options?.productsPerUrl}`);

  try {
    const results = await processProducts({
      urls: options?.urls,
      productsPerUrl: options?.productsPerUrl,
    });

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

// POST endpoint for manual processing with options
export async function POST(request: Request) {
  try {
    const authResponse = await basicAuth(request);
    if (authResponse) return authResponse;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { urls, productsPerUrl } = body;

    const results = await runProcessing({
      urls,
      productsPerUrl,
      isCron: false,
    });

    return NextResponse.json({
      success: true,
      data: results,
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

// GET endpoint for CRON jobs
export async function GET(request: Request) {
  // First check if it's a CRON request
  if (!verifyCron(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // CRON jobs process all URLs with default settings
    const results = await runProcessing({ isCron: true });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("CRON error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
