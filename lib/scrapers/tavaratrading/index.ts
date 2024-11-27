import { scrapeProducts } from "./scraper";
import { processProducts } from "../base-pipeline";

export const PRODUCT_URLS = [
  "https://www.tavaratrading.com/toimistokalusteet/98/vetaytymistilat/kaytetyt-puhelinkopit-ja-hiljaiset-neuvottelutilat",
  // "https://www.tavaratrading.com/toimistokalusteet/48/sahkopoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/1/tyo-satula-ja-valvomotuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/4/tyopoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/7/sailytys",
  // "https://www.tavaratrading.com/toimistokalusteet/10/neuvottelupoydat-ja-tuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/194/korkeat-poydat-ja-tuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/13/sohvat-nojatuolit-penkit-ja-rahit",
  // "https://www.tavaratrading.com/toimistokalusteet/189/sohvapoydat-pikku-poydat-ja-jakkarat",
  // "https://www.tavaratrading.com/toimistokalusteet/14/sermit-ja-akustiikka",
  // "https://www.tavaratrading.com/toimistokalusteet/37/valaisimet",
  // "https://www.tavaratrading.com/toimistokalusteet/67/matot",
  // "https://www.tavaratrading.com/toimistokalusteet/17/lisavarusteet",
  // "https://www.tavaratrading.com/toimistokalusteet/110/ravintolakalusteet",
];

export async function processTavaraTrading(options?: {
  urls?: string[];
  productsPerUrl?: number;
  isTestData?: boolean;
}) {
  return processProducts(scrapeProducts, {
    urls: options?.urls || PRODUCT_URLS,
    productsPerUrl: options?.productsPerUrl,
    isTestData: options?.isTestData,
    company: "Tavara-Trading",
  });
}
