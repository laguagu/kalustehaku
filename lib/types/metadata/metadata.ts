import { z } from "zod";

// Materiaalit
const FurnitureMaterialEnum = z.enum([
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
const FurnitureColorEnum = z.enum([
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
const FurnitureMainGategoryEnum = z.enum([
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

const FurnitureCategoryEnum = z.enum([
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
const RoomTypeEnum = z.enum([
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
const ConditionEnum = z.enum([
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
  mainGategory: FurnitureMainGategoryEnum.describe("Pääkategoria)"),
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
      "Yksityiskohtainen ja kattava visuaalinen kuvaus huonekalusta semanttista hakua varten",
    ),
});

export type ProductMetadata = z.infer<typeof FurnitureMetadataSchema>;
