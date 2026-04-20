/**
 * Manual test script for Dify API client
 * Usage: npx tsx scripts/test-dify.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { listDocuments } from "../src/lib/dify";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      process.env[key] = value;
    }
    console.log("✓ .env.local loaded");
  } catch {
    console.error("✗ .env.local not found. Copy .env.local.example and fill in your keys.");
    process.exit(1);
  }
}

async function main() {
  loadEnv();

  console.log("\n--- listDocuments() ---");
  const result = await listDocuments(1, 20);

  console.log(`✓ Success`);
  console.log(`  Total documents : ${result.total}`);
  console.log(`  Page            : ${result.page}`);
  console.log(`  Has more        : ${result.has_more}`);

  if (result.data.length === 0) {
    console.log("  (no documents uploaded yet)");
  } else {
    console.log("\n  Documents:");
    for (const doc of result.data) {
      console.log(`  - [${doc.id}] ${doc.name}`);
      console.log(`      status: ${doc.indexing_status}  tokens: ${doc.tokens}`);
    }
  }
}

main().catch((err) => {
  console.error("✗ Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
