import { db } from "./drizzle";
import { products, test_products } from "./schema";

export const dbConfig = {
  useTestDb: true,
  getQueryHelper() {
    return this.useTestDb ? db.query.test_products : db.query.products;
  },
  getTable() {
    return this.useTestDb ? test_products : products;
  },
  // funktio Supabase RPC funktion nimen hakemiseen
  getMatchFunction() {
    return this.useTestDb
      ? "test_match_furnitures_with_filter"
      : "match_furnitures_with_filter";
  },
};
