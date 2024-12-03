import { scraperService } from "@/lib/services/cron-service";
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
    "utf-8"
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

// GET endpoint for checking status
export async function GET(request: Request) {
  try {
    const authResponse = await basicAuth(request);
    if (authResponse) return authResponse;

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
      { status: 500 }
    );
  }
}

// POST endpoint for running scrapers (used by Kubernetes CronJob)
export async function POST(request: Request) {
  try {
    const authResponse = await basicAuth(request);
    if (authResponse) return authResponse;

    const startTime = Date.now();
    const results = await scraperService.runAllScrapers();

    if (results === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Scraping is already in progress",
        },
        { status: 409 }
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
      { status: 500 }
    );
  }
}
