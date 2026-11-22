import { readdir, unlink } from "node:fs/promises";
import path from "node:path";

// Next.js can copy build-time .env files into its standalone output.
// Runtime secrets must come from the deployment environment instead.
const output = path.resolve(".next/standalone");
for (const entry of await readdir(output, { withFileTypes: true })) {
  if (entry.isFile() && /^\.env(?:\.|$)/.test(entry.name)) {
    await unlink(path.join(output, entry.name));
  }
}
console.log("Standalone artifact checked: no root environment files retained.");
