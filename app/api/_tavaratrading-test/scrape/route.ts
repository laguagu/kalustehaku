import { scrapeProducts } from "@/lib/scrapers/tavaratrading/scraper";
import { NextResponse } from "next/server";

export async function GET() {
  const testUrl = "https://www.tavaratrading.com/arkistokaapit/2833";

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
