import { generateFurnitureMetadata } from "@/lib/ai/product-analyzer";
import { NextResponse } from "next/server";

export async function GET() {
  // Testimme ensimmäinen tuote tavaratrading.comista
  const testProduct = {
    id: "2833",
    name: "NARBUTAS UNI arkistokaappi, varastotuote",
    description: "Lev. 80 x kork. 190 cm. Valkoinen.",
    price: 346.0,
    condition: "Käytetty",
    imageUrl:
      "https://www.tavaratrading.com/uploaded/images_thumb/x5c081_2.jpg",
    category: "arkistokaapit",
    availability: "Varastotuote",
  };

  try {
    console.log("Starting test analysis...");
    const metadata = await generateFurnitureMetadata(testProduct);

    return NextResponse.json({
      success: true,
      data: {
        product: testProduct,
        metadata: metadata,
      },
    });
  } catch (error) {
    console.error("Test analysis failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
