import { processProducts } from "../base-pipeline";
import { scrapeProducts } from "./scraper";

/*
Mikäli Screipperi blokataan sivuilta jossa vaaditaan navigointia uudelle sivulle, esim: "https://offistore.fi/verkkokauppa/fin/tuolit-78"
Syötä URL yksittäin jokainen sivu kerrallaan tässä tapauksessa.
https://offistore.fi/verkkokauppa/fin/tuolit-78?p=4 

Voit syöttää kaikki yksittäiset sivut PRODUCT_URL listalle ne käsitelleen kaikki.
*/

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
