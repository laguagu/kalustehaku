import { processProducts } from "../base-pipeline";
import { scrapeProducts } from "./scraper";

/*
Mikäli Screipperi blokataan sivuilta jossa vaaditaan navigointia uudelle sivulle, esim: "https://offistore.fi/verkkokauppa/fin/tuolit-78"
Syötä URL yksittäin jokainen sivu kerrallaan tässä tapauksessa.
https://offistore.fi/verkkokauppa/fin/tuolit-78?p=4 

Voit syöttää kaikki yksittäiset sivut PRODUCT_URL listalle ne käsitelleen kaikki.*
Kaikki PRODUCT_URLS listan URLit käydään läpi.
*/

export const PRODUCT_URLS = [
  // "https://www.tavaratrading.com/toimistokalusteet/48/sahkopoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/1/tyo-satula-ja-valvomotuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/4/tyopoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/7/sailytys",
  // "https://www.tavaratrading.com/toimistokalusteet/173/neuvottelupoydat-ja-tuolit/kaytetyt-neuvottelupoydat",
  // "https://www.tavaratrading.com/toimistokalusteet/11/neuvottelupoydat-ja-tuolit/kaytetyt-neuvottelu-ja-asiakastuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/139/neuvottelupoydat-ja-tuolit/kaytetyt-neuvotteluryhmat",
  // "https://www.tavaratrading.com/toimistokalusteet/194/korkeat-poydat-ja-tuolit",
  // "https://www.tavaratrading.com/toimistokalusteet/13/sohvat-nojatuolit-penkit-ja-rahit",
  // "https://www.tavaratrading.com/toimistokalusteet/189/sohvapoydat-pikku-poydat-ja-jakkarat",
  // "https://www.tavaratrading.com/toimistokalusteet/37/valaisimet",
  // "https://www.tavaratrading.com/toimistokalusteet/67/matot",
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
