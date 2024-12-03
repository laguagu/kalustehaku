import { processProducts } from "../base-pipeline";
import { scrapeProducts } from "./scraper";

export const PRODUCT_URLS = [
  "https://www.tavaratrading.com/toimistokalusteet/54/sahkopoydat/kaytetyt-sahkopoydat",
  "https://www.tavaratrading.com/toimistokalusteet/2/tyo-satula-ja-valvomotuolit/kaytetyt-tyotuolit",
  "https://www.tavaratrading.com/toimistokalusteet/5/tyopoydat/kaytetyt-tyopoydat",
  "https://www.tavaratrading.com/toimistokalusteet/8/sailytys/kaytetyt-sailytyskalusteet",
  "https://www.tavaratrading.com/toimistokalusteet/173/neuvottelupoydat-ja-tuolit/kaytetyt-neuvottelupoydat",
  "https://www.tavaratrading.com/toimistokalusteet/11/neuvottelupoydat-ja-tuolit/kaytetyt-neuvottelu-ja-asiakastuolit",
  "https://www.tavaratrading.com/toimistokalusteet/139/neuvottelupoydat-ja-tuolit/kaytetyt-neuvotteluryhmat",
  "https://www.tavaratrading.com/toimistokalusteet/195/korkeat-poydat-ja-tuolit/kaytetyt-korkeat-poydat",
  "https://www.tavaratrading.com/toimistokalusteet/29/sohvat-nojatuolit-penkit-ja-rahit/kaytetyt-sohvat-nojatuolit-ja-rahit",
  "https://www.tavaratrading.com/toimistokalusteet/190/sohvapoydat-pikku-poydat-ja-jakkarat/kaytetyt-sohva-ja-pikkupoydat",
  "https://www.tavaratrading.com/toimistokalusteet/187/sermit-ja-akustiikka/kaytetyt-akustiset-kalusteet-ja-paneelit",
  "https://www.tavaratrading.com/toimistokalusteet/38/valaisimet/kaytetyt-valaisimet",
  "https://www.tavaratrading.com/toimistokalusteet/109/matot/kaytetyt-matot",
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
