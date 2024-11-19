import { scrapeAndUpdateProducts } from "@/lib/scripts/scraper";
import cron from "node-cron";

export function initializeCronJobs() {
  // Aja joka päivä klo 02:00
  cron.schedule("0 2 * * *", async () => {
    console.log("Starting daily product update...");
    try {
      await scrapeAndUpdateProducts();
      console.log("Daily product update completed successfully");
    } catch (error) {
      console.error("Error in daily product update:", error);
    }
  });
}
