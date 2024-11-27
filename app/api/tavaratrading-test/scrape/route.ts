import { PRODUCT_URLS } from "@/lib/scrapers/constants";
import { scrapeProducts } from "@/lib/scrapers/tavaratrading/scraper";
import { NextResponse } from "next/server";

export async function GET() {
  const testUrl = PRODUCT_URLS[0];

  try {
    const results = await scrapeProducts(testUrl, {
      company: "Tavara-Trading",
    });
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Pipeline test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
