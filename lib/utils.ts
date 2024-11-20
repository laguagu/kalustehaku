import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProductMetadata } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSearchTerms(metadata: ProductMetadata): string {
  const terms = [
    metadata.style,
    ...metadata.materials,
    ...metadata.colors,
    ...metadata.roomType,
    ...metadata.functionalFeatures,
    metadata.designStyle,
    metadata.condition,
    ...metadata.suitableFor,
  ];

  return terms.join(" ").toLowerCase();
}
