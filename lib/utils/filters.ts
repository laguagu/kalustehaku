import { COLOR_GROUPS_MAP } from "../types/filters/colorGroups";
import { ProductMetadata } from "../types/metadata/metadata";

export const cleanFilters = (filters: Partial<ProductMetadata> | undefined) => {
  if (!filters) return {};

  // Puhdistettu objekti
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
