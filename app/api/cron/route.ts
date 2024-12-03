import { scraperService } from "@/lib/services/cron-service";
import { NextResponse } from "next/server";

// GET endpoint for checking status
export async function GET() {
  try {
    const status = scraperService.getStatus();
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error("Failed to get status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST endpoint for running scrapers (used by Kubernetes CronJob)
export async function POST() {
  try {
    const startTime = Date.now();
    const results = await scraperService.runAllScrapers();

    if (results === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Scraping is already in progress",
        },
        { status: 409 },
      );
    }

    const duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      results,
    });
  } catch (error) {
    console.error("Failed to run scrapers:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
