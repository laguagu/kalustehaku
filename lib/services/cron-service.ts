import { processOffiStore } from "../scrapers/offistore";
import { processTavaraTrading } from "../scrapers/tavaratrading";
import { ScraperOptions } from "../types/products/types";

class ScraperService {
  private scrapers = {
    offistore: processOffiStore,
    tavaratrading: processTavaraTrading,
  };

  private isRunning = false;

  async runScraperJob(company: string, isTestData: boolean = false) {
    const startTime = Date.now();
    console.log(
      `[Scraper] Starting scraper for ${company} at ${new Date().toISOString()}`,
    );

    try {
      const processFunction =
        this.scrapers[company.toLowerCase() as keyof typeof this.scrapers];
      if (!processFunction) {
        throw new Error(`Invalid scraper specified: ${company}`);
      }

      const options: ScraperOptions = {
        company,
        isTestData,
        isCron: true,
      };

      const results = await processFunction(options);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[Scraper] ${company} completed in ${duration}s`);
      console.log(`Processed: ${results.scraping.totalProcessed}`);
      console.log(`Successful: ${results.scraping.successful}`);
      console.log(`Failed: ${results.scraping.failed}`);

      return results;
    } catch (error) {
      console.error(`[Scraper] ${company} failed:`, error);
      throw error;
    }
  }

  async runAllScrapers() {
    if (this.isRunning) {
      console.log("Scraping is already in progress");
      return null;
    }

    this.isRunning = true;
    const results = [];
    const companies = ["tavaratrading", "offistore"];

    try {
      for (const company of companies) {
        try {
          const result = await this.runScraperJob(company);
          results.push({
            company,
            success: true,
            data: result,
          });
        } catch (error) {
          results.push({
            company,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      return results;
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
    };
  }
}

// Singleton instance
export const scraperService = new ScraperService();
