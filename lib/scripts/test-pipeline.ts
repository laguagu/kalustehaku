// scripts/test-pipeline.ts
import dotenv from "dotenv";
import { processProducts } from "../product-pipeline";
dotenv.config({ path: ".env.local" });

async function testPipeline() {
  try {
    console.log("Starting pipeline test...");

    // Testaa yhdellä URL:lla
    const testUrl =
      "https://www.tavaratrading.com/toimistokalusteet/1/tyo-satula-ja-valvomotuolit";

    const results = await processProducts(testUrl);

    console.log("\nPipeline results:");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Pipeline test failed:", error);
  }
}

testPipeline();
