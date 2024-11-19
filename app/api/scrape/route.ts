// app/api/scrape/route.ts
import { processProducts } from "@/lib/product-pipeline";
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

export async function POST(request: Request) {
  try {
    // Check authentication
    const authResponse = await basicAuth(request);
    if (authResponse) return authResponse;

    // Get URL from request body if provided
    const body = await request.json().catch(() => ({}));
    const url = body.url;

    const results = await processProducts(url);
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

// GET endpoint for status check and CRON
export async function GET(request: Request) {
  // Verify that this is a CRON request
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const results = await processProducts();
    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
