// api/tavaratrading/scrape/route.ts
// Aja manuaalisesti web screippereitä, vanha versio. Uudessa toteutuksessa api/cron/route.ts korvaa tämän tiedoston.

import { processOffiStore } from "@/lib/scrapers/offistore";
import { processTavaraTrading } from "@/lib/scrapers/tavaratrading";
import { ScraperOptions } from "@/lib/types/products/types";
import { NextResponse } from "next/server";

const scrapers = {
  tavaratrading: processTavaraTrading,
  offistore: processOffiStore,
};

const companyNames = ["tavaratrading", "offistore"];

async function runProcessing(options: ScraperOptions) {
  const startTime = Date.now();
  const dataType = options.isTestData ? "TEST" : "PRODUCTION";

  console.log(
    `[${dataType} Processing] Starting at ${new Date().toISOString()}`,
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
    console.log(`Processing Completed in ${duration}s`);
    console.log(`Processed: ${results.scraping.totalProcessed}`);
    console.log(`Successful: ${results.scraping.successful}`);
    console.log(`Failed: ${results.scraping.failed}`);

    return results;
  } catch (error) {
    console.error(`Processing Failed:`, error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const {
      company = companyNames[1], // Set wanted scraper here for example "tavaratrading" is [0] and "offistore" is [1]. Look top of the file scrapers object;
      urls,
      productsPerUrl,
      isTestData = false,
    } = body;

    const results = await runProcessing({
      company,
      urls,
      productsPerUrl,
      isTestData,
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
