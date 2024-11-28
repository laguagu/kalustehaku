import { and, eq } from "drizzle-orm";
import "server-only";
import { generateEmbedding } from "../ai/generate-embedding";
import { PreparedProduct, ProductWithMetadata } from "../types/products/types";
import { generateSearchTerms } from "../utils";
import { db } from "./drizzle";
import { Product, products } from "./schema";

// Helper to convert number to decimal string
function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return price.toFixed(2);
}

// Prepare product data for database. Generate embedding and search terms
export async function prepareProductForDB(
  product: ProductWithMetadata,
): Promise<PreparedProduct> {
  const embedding = await generateEmbedding(product.metadata);
  const searchTerms = generateSearchTerms(product.metadata);

  return {
    ...product,
    price: formatPrice(product.price),
    embedding: embedding,
    searchTerms,
    updatedAt: new Date(),
    isTestData: product.isTestData,
  };
}

export async function upsertProduct(preparedProduct: PreparedProduct) {
  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.id, preparedProduct.id),
      eq(products.company, preparedProduct.company),
    ),
  });

  if (!existing) {
    console.log(
      `Inserting new product: ${preparedProduct.name} from ${preparedProduct.company}`,
    );
    return await db.insert(products).values(preparedProduct);
  }

  console.log(
    `Updating existing product: ${preparedProduct.name} from ${preparedProduct.company}`,
  );
  return await db
    .update(products)
    .set(preparedProduct)
    .where(
      and(
        eq(products.id, preparedProduct.id),
        eq(products.company, preparedProduct.company),
      ),
    );
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return await db.query.products.findFirst({
    where: eq(products.id, id),
  });
}

export async function getProductByIdAndCompany(
  id: string,
  company: string,
): Promise<Product | undefined> {
  return await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.company, company)),
  });
}

export async function getAllProducts(): Promise<Product[]> {
  return await db.query.products.findMany();
}

export async function deleteProduct(id: string, company: string) {
  return await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.company, company)));
}
