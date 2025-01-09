import { z } from "zod";

// Materiaalit
export const FurnitureMaterialEnum = z.enum([
  "puu",
  "metalli",
  "lasi",
  "muovi",
  "tekstiili",
  "nahka",
  "vaneri",
  "marmori",
  "kivi",
  "bambu",
  "rottinki",
]);

// Värit - sisältää yleisimmät huonekaluissa käytetyt värit
export const FurnitureColorEnum = z.enum([
  "musta",
  "valkoinen",
  "harmaa",
  "ruskea",
  "beige",
  "tammi",
  "koivu",
  "pähkinä",
  "mahonki",
  "sininen",
  "vihreä",
  "punainen",
  "keltainen",
  "kulta",
  "hopea",
  "pronssi",
  "monivärinen",
  "tummanharmaa",
  "vaaleanharmaa",
  "luonnonvalkoinen",
  "tummapuu",
  "vaalea tammi",
  "vaaleapuu",
  "turkoosi",
  "oranssi",
  "purppura",
]);

// Kategoriat
export const FurnitureMainCategoryEnum = z.enum([
  "tuolit",
  "sohvat",
  "pöydät",
  "säilytys",
  "sängyt",
  "valaisimet",
  "matot",
  "peilit",
  "muut",
]);

export const FurnitureCategoryEnum = z.enum([
  "tuolit",
  "työtuolit",
  "nojatuolit",
  "sohvat",
  "rahit",
  "jakkarat",
  "ruokailutuolit",
  "pöydät",
  "työpöydät",
  "ruokapöydät",
  "sohvapöydät",
  "sivupöydät",
  "neuvottelupöydät",
  "baaripöydät",
  "säilytys",
  "kaapit",
  "lipastot",
  "hyllyt",
  "vaatekaapit",
  "tv-tasot",
  "vitriinit",
  "naulakot",
  "sängyt",
  "sohvasängyt",
  "vuodesohvat",
  "runkopatjat",
  "jenkkisängyt",
  "valaisimet",
  "pöytävalaisimet",
  "lattialamput",
  "kattovalaisimet",
  "työpistevalaisimet",
  "matot",
  "käytävämatot",
  "aluematot",
  "peilit",
  "seinähyllyt",
  "tilanjakajat",
  "ulkokalusteet",
  "terassikalusteet",
  "puutarhakalusteet",
  "muut",
]);

// Huonetyypit
export const RoomTypeEnum = z.enum([
  "olohuone",
  "makuuhuone",
  "keittiö",
  "ruokailuhuone",
  "eteinen",
  "työhuone",
  "kylpyhuone",
  "lastenhuone",
  "parveke",
  "terassi",
  "kirjasto",
  "vaatehuone",
]);

// Kuntoasteikko
export const ConditionEnum = z.enum([
  "uudenveroinen",
  "erinomainen",
  "hyväkuntoinen",
  "käyttökuntoinen",
  "kunnostettava",
  "entisöitävä",
  "Ei tietoa",
]);

export const FurnitureMetadataSchema = z.object({
  style: z
    .string()
    .describe("Vallitseva tyyli (esim. moderni, skandinaavinen, teollinen)"),
  materials: z.array(FurnitureMaterialEnum).describe("Päämateriaalit listana"),
  brand: z
    .string()
    .describe(
      "Pyri tunnistamaan valmistaja tai brändi tuotteen nimestä, kuvauksesta tai muista tiedoista. Jätä tyhjäksi jos et ole varma.",
    ),
  category: FurnitureCategoryEnum.describe("Tuotekategoria"),
  mainGategory: FurnitureMainCategoryEnum.describe("Pääkategoria)"),
  colors: z.array(FurnitureColorEnum).describe("Päävärit ja sävyt listana"),
  roomType: z.array(RoomTypeEnum).describe("Sopivat huoneet/tilat listana"),
  functionalFeatures: z
    .array(z.string())
    .describe("Toiminnalliset ominaisuudet ja erityispiirteet"),
  designStyle: z.string().describe("Suunnittelutyyli ja -aikakausi"),
  condition: ConditionEnum.describe("Kunnon tarkempi analyysi"),
  suitableFor: z
    .array(z.string())
    .describe("Sopivat käyttötarkoitukset ja -tilanteet"),
  visualDescription: z
    .string()
    .describe(
      "Yksityiskohtainen visuaalinen kuvaus huonekalusta semanttista hakua varten. Sisällytä selkeästi: 1) päävärit ja niiden sävyt, 2) huonekalun tyyppi/kategoria, 3) muoto ja rakenne, 4) materiaalit ja pintakäsittelyt. Esimerkki: 'Mattavalkoinen puinen ruokapöydän tuoli, jossa on korkeahko selkänoja ja pehmustettu istuinosa. Tuolin jalat ovat vaaleaa tammea ja verhoilu on tehty valkoisella tekstiilillä.' Mainitse aina värit ja kalustekategoria ensimmäisenä hakuosuvuuden parantamiseksi.",
    ),
});

export const FurnitureFiltterObject = z.object({
  mainGategory: FurnitureMainCategoryEnum.describe("Pääkategoria)"),
  materials: z.array(FurnitureMaterialEnum).describe("Päämateriaalit listana"),
  colors: z.array(FurnitureColorEnum).describe("Päävärit ja sävyt listana"),
});

export type ProductMetadata = z.infer<typeof FurnitureMetadataSchema>;
export type ConditionEnum = z.infer<typeof ConditionEnum>;
export type RoomTypeEnum = z.infer<typeof RoomTypeEnum>;
export type FurnitureCategoryEnum = z.infer<typeof FurnitureCategoryEnum>;
export type FurnitureMainCategoryEnum = z.infer<
  typeof FurnitureMainCategoryEnum
>;
export type FurnitureColorEnum = z.infer<typeof FurnitureColorEnum>;
export type FurnitureMaterialEnum = z.infer<typeof FurnitureMaterialEnum>;
