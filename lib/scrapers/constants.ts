// Käsiteltävät URL:it. Ellei annettu parametrina, käytetään oletusarvoja. Poista kommentit käyttääksesi kaikkia kategorioita.
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

export const MAX_CONCURRENT_URLS = 3; // Montako URL:ää käsitellään rinnakkain
export const MAX_CONCURRENT_PRODUCTS = 5; // Montako tuotetta per URL käsitellään rinnakkain
export const RATE_LIMIT_DELAY = 1000; // 1 sekunti OpenAI pyyntöjen välillä
