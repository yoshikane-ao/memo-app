import dotenv from "dotenv";
dotenv.config();

import type { SignOptions, Secret } from "jsonwebtoken";

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`ENV ${name} is required`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 3004),
  jwtSecret: mustGet("JWT_SECRET") as Secret,
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
};