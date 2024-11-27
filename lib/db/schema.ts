import { sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  json,
  pgTable,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import { ProductMetadata } from "../types/metadata/metadata";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }),
  condition: text("condition"),
  imageUrl: text("image_url"),
  productUrl: text("product_url"),
  category: text("category"),
  availability: text("availability"),
  company: text("company"),
  isTestData: boolean("is_test_data").default(false),
  metadata: json("metadata").$type<ProductMetadata>().notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  searchTerms: text("search_terms"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
