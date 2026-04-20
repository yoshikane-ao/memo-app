import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  // 起動時に検証することで、初回クエリまでエラーが遅延する事態を防ぐ。
  // CI / e2e でもこのガードで早期に設定ミスを検知できる。
  throw new Error("DATABASE_URL is required (set it in .env or environment).");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });