import { processProducts } from "@/lib/product-pipeline";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const testUrl =
      "https://www.tavaratrading.com/toimistokalusteet/48/sahkopoydat";

    const results = await processProducts(testUrl);

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
      { status: 500 }
    );
  }
}
