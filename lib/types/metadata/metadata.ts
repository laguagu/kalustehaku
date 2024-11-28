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
]);

// Kategoriat
const FurnitureCategoryEnum = z.enum([
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
  category: FurnitureCategoryEnum.describe("Tuotekategoria"),
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
    .describe("Yksityiskohtainen visuaalinen kuvaus huonekalusta"),
});

export type ProductMetadata = z.infer<typeof FurnitureMetadataSchema>;
