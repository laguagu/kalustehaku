export interface SearchResult {
  id: string;
  name: string;
  price: number | null;
  image_url: string;
  product_url: string;
  condition: string;
  metadata: {
    style: string;
    materials: string[];
    colors: string[];
    category: string;
    mainGategory: string;
    roomType: string[];
    functionalFeatures: string[];
    designStyle: string;
    condition: string;
    suitableFor: string[];
    visualDescription: string;
  };
  similarity: number;
  company: string;
}
