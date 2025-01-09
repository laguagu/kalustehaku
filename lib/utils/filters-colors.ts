import { COLOR_GROUPS_MAP } from "../types/filters/colorGroups";
import { ProductMetadata } from "../types/metadata/metadata";

export const cleanFilters = (filters: Partial<ProductMetadata> | undefined) => {
  if (!filters) return {};

  const cleaned: Partial<ProductMetadata> = {};

  if (filters.mainGategory?.trim()) {
    cleaned.mainGategory = filters.mainGategory;
  }

  if (filters.materials?.length) {
    const cleanMaterials = filters.materials.filter(
      (item) => item && item.trim() !== "",
    );
    if (cleanMaterials.length > 0) {
      cleaned.materials = cleanMaterials;
    }
  }

  if (filters.colors?.length) {
    const cleanColors = filters.colors.filter(
      (item) => item && item.trim() !== "",
    );
    if (cleanColors.length > 0) {
      cleaned.colors = cleanColors;
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : {};
};

export const expandColorGroups = (colorGroups: string[]): string[] => {
  return colorGroups.flatMap(
    (group) => COLOR_GROUPS_MAP[group as keyof typeof COLOR_GROUPS_MAP] || [],
  );
};

export const findColorGroups = (colors: string[]): string[] => {
  const colorGroups = new Set<string>();

  colors.forEach((color) => {
    Object.entries(COLOR_GROUPS_MAP).forEach(([groupName, groupColors]) => {
      // Jos väri löytyy tästä ryhmästä, lisätään ryhmä
      if ((groupColors as readonly string[]).includes(color)) {
        colorGroups.add(groupName);
      }
    });
  });

  return Array.from(colorGroups);
};

export const COLOR_HEX_MAP = {
  // Tummat
  musta: "#000000",
  tummanharmaa: "#303030",
  tummapuu: "#2F1914",
  harmaa: "#666666",
  ruskea: "#513B2F",
  pronssi: "#CD7F32", // Kirkkaampi pronssi

  // Vaaleat
  valkoinen: "#FFFFFF",
  luonnonvalkoinen: "#F5F2E9",
  beige: "#E8DCC4",
  vaaleanharmaa: "#D8D8D8",
  hopea: "#C0C0C0",

  // Puut
  tammi: "#8B6C4E",
  koivu: "#E3CFB4",
  pähkinä: "#594539",
  mahonki: "#4A2724",
  "vaalea tammi": "#C4A484",
  vaaleapuu: "#DBC1AC",

  // Värilliset - selkeämmät ja erottuvammat
  sininen: "#0066CC", // Kirkkaampi sininen
  vihreä: "#228B22", // Perinteinen forest green
  punainen: "#CC0000", // Selkeä punainen
  keltainen: "#FFD700", // Kirkas kultainen keltainen
  turkoosi: "#00CED1", // Kirkkaampi turkoosi
  oranssi: "#FF8C00", // Selkeä oranssi
  purppura: "#800080", // Selkeä purppura
  kulta: "#DAA520", // Selkeä kultainen
  monivärinen: "linear-gradient(45deg, #CC0000, #228B22, #0066CC)", // Selkeämmät perusvärit
} as const;

export const getContrastTextColor = (backgroundColor: string): string => {
  // Erikoistapaukset
  if (backgroundColor.includes("gradient")) return "#FFFFFF";

  // Värikoodin validointi
  const hexMatch = backgroundColor.match(/^#([0-9A-Fa-f]{6})$/);
  if (!hexMatch) {
    console.warn("Invalid hex color:", backgroundColor);
    return "#000000";
  }

  // Käytetään suoraan match-tulosta
  const [r, g, b] = hexMatch[1]
    .match(/.{2}/g)!
    .map((val) => parseInt(val, 16) / 255);

  // Luminanssin laskenta
  const getLinearRGB = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * getLinearRGB(r) +
    0.7152 * getLinearRGB(g) +
    0.0722 * getLinearRGB(b);

  // Käytetään suoraan luminanssia kontrastin päättelyyn
  return luminance > 0.179 ? "#000000" : "#FFFFFF";
};
