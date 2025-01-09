import { and, eq, notInArray } from "drizzle-orm";
import "server-only";
import { PreparedProduct } from "../types/products/types";
import { dbConfig } from "./config";
import { db } from "./drizzle";

export async function upsertProduct(preparedProduct: PreparedProduct) {
  const queryHelper = dbConfig.getQueryHelper();
  const table = dbConfig.getTable();

  const existing = await queryHelper.findFirst({
    where: and(
      eq(table.id, preparedProduct.id),
      eq(table.company, preparedProduct.company),
    ),
  });

  if (!existing) {
    console.log(
      `Uusi tuote löydetty ja lisätty: ${preparedProduct.name} (ID: ${preparedProduct.id})`,
    );
    return await db.insert(table).values(preparedProduct);
  }

  return await db
    .update(table)
    .set(preparedProduct)
    .where(
      and(
        eq(table.id, preparedProduct.id),
        eq(table.company, preparedProduct.company),
      ),
    );
}

export async function getProductById(id: string) {
  const queryHelper = dbConfig.getQueryHelper();
  const table = dbConfig.getTable();

  return await queryHelper.findFirst({
    where: eq(table.id, id),
  });
}

export async function getProductByIdAndCompany(id: string, company: string) {
  const queryHelper = dbConfig.getQueryHelper();
  const table = dbConfig.getTable();

  return await queryHelper.findFirst({
    where: and(eq(table.id, id), eq(table.company, company)),
  });
}

export async function getAllProducts() {
  const queryHelper = dbConfig.getQueryHelper();

  return await queryHelper.findMany();
}

export async function deleteProduct(id: string, company: string) {
  const table = dbConfig.getTable();

  return await db
    .delete(table)
    .where(and(eq(table.id, id), eq(table.company, company)));
}

export async function findRemovedProducts(
  company: string,
  isTestData: boolean,
  scrapedIds: string[],
) {
  const queryHelper = dbConfig.getQueryHelper();
  const table = dbConfig.getTable();

  return await queryHelper.findMany({
    where: and(
      eq(table.company, company),
      eq(table.isTestData, isTestData),
      notInArray(table.id, scrapedIds),
    ),
  });
}

interface ProductToRemove {
  id: string;
  name: string;
}

export async function removeProducts(
  productsToRemove: ProductToRemove[],
  company: string,
) {
  const table = dbConfig.getTable();

  for (const product of productsToRemove) {
    await db
      .delete(table)
      .where(and(eq(table.id, product.id), eq(table.company, company)));
  }
}
