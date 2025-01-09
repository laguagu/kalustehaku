import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { ProductMetadata } from "../types/metadata/metadata";

export const products = pgTable(
  "products",
  {
    uniqueId: uuid("unique_id").defaultRandom().primaryKey(),
    id: text("id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    condition: text("condition"),
    imageUrl: text("image_url"),
    productUrl: text("product_url"),
    category: text("category"),
    availability: text("availability"),
    company: text("company").notNull(),
    isTestData: boolean("is_test_data").default(false),
    metadata: jsonb("metadata").$type<ProductMetadata>().notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    searchTerms: text("search_terms"),
    createdAt: timestamp("created_at").default(sql`NOW()`),
    updatedAt: timestamp("updated_at").default(sql`NOW()`),
  },
  (table) => [uniqueIndex("unique_product_source").on(table.id, table.company)],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// Test products table
export const test_products = pgTable(
  "test_products",
  {
    uniqueId: uuid("unique_id").defaultRandom().primaryKey(),
    id: text("id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    condition: text("condition"),
    imageUrl: text("image_url"),
    productUrl: text("product_url"),
    category: text("category"),
    availability: text("availability"),
    company: text("company").notNull(),
    isTestData: boolean("is_test_data").default(true),
    metadata: jsonb("metadata").$type<ProductMetadata>().notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    searchTerms: text("search_terms"),
    createdAt: timestamp("created_at").default(sql`NOW()`),
    updatedAt: timestamp("updated_at").default(sql`NOW()`),
  },
  (table) => [
    uniqueIndex("unique_test_product_source").on(table.id, table.company),
  ],
);

export type TestProduct = typeof test_products.$inferSelect;
export type NewTestProduct = typeof test_products.$inferInsert;
