// scripts/test-pipeline.ts
import dotenv from "dotenv";
import { processProducts, PRODUCT_URLS } from "../product-pipeline";

dotenv.config({ path: ".env.local" });

async function testPipeline() {
  try {
    console.log("Starting pipeline test...");

    // Testaa kahta ensimmäistä kategoriaa
    const testUrls = PRODUCT_URLS.slice(0, 2);

    const results = await processProducts({
      urls: testUrls,
      productsPerUrl: 2,
    });

    console.log("\nPipeline results:", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Pipeline test failed:", error);
  }
}

testPipeline();
