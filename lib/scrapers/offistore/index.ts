import { processProducts } from "../base-pipeline";
import { scrapeProducts } from "./scraper";

const PRODUCT_URLS = [
  // "https://offistore.fi/verkkokauppa/fin/tuolit-78",
  "https://offistore.fi/verkkokauppa/fin/aktiivituolit-80",
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
