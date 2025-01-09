import {
  pgTable,
  index,
  uniqueIndex,
  pgPolicy,
  text,
  numeric,
  jsonb,
  vector,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const products = pgTable(
  "products",
  {
    id: text().notNull(),
    name: text().notNull(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }),
    condition: text(),
    imageUrl: text("image_url"),
    category: text(),
    availability: text(),
    metadata: jsonb().notNull(),
    embedding: vector({ dimensions: 1536 }),
    searchTerms: text("search_terms"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
    productUrl: text("product_url"),
    company: text().notNull(),
    isTestData: boolean("is_test_data").default(false),
    uniqueId: uuid("unique_id").defaultRandom().primaryKey().notNull(),
  },
  (table) => {
    return {
      idxProductsMetadata: index("idx_products_metadata").using(
        "gin",
        table.metadata.asc().nullsLast().op("jsonb_ops"),
      ),
      uniqueProductSource: uniqueIndex("unique_product_source").using(
        "btree",
        table.id.asc().nullsLast().op("text_ops"),
        table.company.asc().nullsLast().op("text_ops"),
      ),
      policyWithSecurityDefinerFunctions: pgPolicy(
        "Policy with security definer functions",
        { as: "permissive", for: "all", to: ["public"], using: sql`true` },
      ),
    };
  },
);
