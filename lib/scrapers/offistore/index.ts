import { processProducts } from "../base-pipeline";
import { scrapeProducts } from "./scraper";

const PRODUCT_URLS = [
  "https://offistore.fi/verkkokauppa/fin/poydat-73",
  "https://offistore.fi/verkkokauppa/fin/tuolit-78",
  "https://offistore.fi/verkkokauppa/fin/sailytyskalusteet-84",
  "https://offistore.fi/verkkokauppa/fin/aulakalusteet-93",
  "https://offistore.fi/verkkokauppa/fin/valaisimet-113",
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
