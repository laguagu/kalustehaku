import { z } from "zod";

/*ToDo: Rajoita tekoälyn kenttien luontia ja määrittele itse z.enum tyyppinä mahdolliset arvot
const FurnitureMaterialEnum = z.enum([
  "puu",
  "metalli",
  "lasi",
  "muovi",
  "tekstiili",
  "nahka",
  "vaneri"
]);
ja käytetään sitä näin materials: z.array(FurnitureMaterialEnum).describe("Päämateriaalit listana"),
*/
export const FurnitureMetadataSchema = z.object({
  style: z
    .string()
    .describe("Vallitseva tyyli (esim. moderni, skandinaavinen, teollinen)"),
  materials: z.array(z.string()).describe("Päämateriaalit listana"),
  category: z.string().describe("Tuotekategoria"),
  colors: z.array(z.string()).describe("Päävärit ja sävyt listana"),
  roomType: z.array(z.string()).describe("Sopivat huoneet/tilat listana"),
  functionalFeatures: z
    .array(z.string())
    .describe("Toiminnalliset ominaisuudet ja erityispiirteet"),
  designStyle: z.string().describe("Suunnittelutyyli ja -aikakausi"),
  condition: z.string().describe("Kunnon tarkempi analyysi"),
  suitableFor: z
    .array(z.string())
    .describe("Sopivat käyttötarkoitukset ja -tilanteet"),
  visualDescription: z
    .string()
    .describe("Yksityiskohtainen visuaalinen kuvaus huonekalusta"),
});

export type ProductMetadata = z.infer<typeof FurnitureMetadataSchema>;
