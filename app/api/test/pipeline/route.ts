import { processProducts, PRODUCT_URLS } from "@/lib/product-pipeline";
import { NextResponse } from "next/server";

export async function GET() {
  const testUrls = PRODUCT_URLS.slice(0, 2);

  try {
    const results = await processProducts({
      urls: testUrls,
      productsPerUrl: 1,
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
