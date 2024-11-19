import { loadEnvConfig } from "@next/env";
import * as dotenv from "dotenv";

const projectDir = process.cwd();
loadEnvConfig(projectDir);
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}
