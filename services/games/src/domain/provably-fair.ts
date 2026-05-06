import { createHash, createHmac, randomBytes } from "crypto";

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashServerSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

export function calculateCrashPoint(serverSeed: string): number {
  const hash = createHmac("sha256", serverSeed).update("crash").digest("hex");
  const int = parseInt(hash.slice(0, 8), 16);
  const e = 2 ** 32;
  const result = Math.max(1, (100 * e - int) / (e - int)) / 100;
  return Math.floor(result * 100) / 100;
}
