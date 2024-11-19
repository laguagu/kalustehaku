// lib/db/operations.ts
import { eq } from "drizzle-orm";
import { generateEmbedding, generateSearchTerms } from "../ai/embedding";
import { PreparedProduct, ScrapedProduct } from "../types";
import { db } from "./drizzle";
import { Product, ProductMetadata, products } from "./schema";
import "server-only";
// Helper to convert number to decimal string
function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return price.toFixed(2);
}

// Prepare product data for database
export async function prepareProductForDB(
  product: ScrapedProduct & { metadata: ProductMetadata }
): Promise<PreparedProduct> {
  const embedding = await generateEmbedding(product.metadata);
  const searchTerms = generateSearchTerms(product.metadata);

  return {
    ...product,
    price: formatPrice(product.price),
    embedding: embedding,
    searchTerms,
    updatedAt: new Date(),
  };
}

export async function upsertProduct(preparedProduct: PreparedProduct) {
  const existing = await db.query.products.findFirst({
    where: eq(products.id, preparedProduct.id),
  });

  if (!existing) {
    console.log(`Inserting new product: ${preparedProduct.name}`);
    return await db.insert(products).values(preparedProduct);
  }

  console.log(`Updating existing product: ${preparedProduct.name}`);
  return await db
    .update(products)
    .set(preparedProduct)
    .where(eq(products.id, preparedProduct.id));
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | undefined> {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
  });
}

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  return await db.query.products.findMany();
}

// Delete product
export async function deleteProduct(id: string) {
  return await db.delete(products).where(eq(products.id, id));
}
