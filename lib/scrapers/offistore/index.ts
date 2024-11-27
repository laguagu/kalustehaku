import { scrapeProducts } from "./scraper";
import { processProducts } from "../base-pipeline";

const PRODUCT_URLS = [
  "https://offistore.fi/verkkokauppa/fin/tuolit-78",
  // ... muut URLit
];

export async function processOffiStore(options?: {
  urls?: string[];
  productsPerUrl?: number;
  isTestData?: boolean;
}) {
  return processProducts(scrapeProducts, {
    urls: options?.urls || PRODUCT_URLS,
    productsPerUrl: options?.productsPerUrl,
    isTestData: options?.isTestData,
    company: "OffiStore",
  });
}
