#!/usr/bin/env node

/**
 * Sync materials.json from R2 to local app/data/materials.json
 *
 * Usage: node sync-materials.js
 * Or add to package.json scripts: "sync": "node sync-materials.js"
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const WORKER_URL =
  "https://r2-catalog-manager.edonaamulaj.workers.dev?action=get";
const LOCAL_FILE = path.join(__dirname, "app", "data", "materials.json");

console.log("🔄 Syncing materials.json from R2...");

https
  .get(WORKER_URL, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);

        if (json.entries && Array.isArray(json.entries)) {
          // Pretty print JSON with 4 spaces indentation
          const formattedJson = JSON.stringify(json.entries, null, 4);

          // Write to local file
          fs.writeFileSync(LOCAL_FILE, formattedJson, "utf8");

          console.log(
            `✅ Successfully synced ${json.entries.length} entries to ${LOCAL_FILE}`
          );
          console.log("📦 Local materials.json updated!");
        } else {
          console.error("❌ Invalid response format from R2");
          process.exit(1);
        }
      } catch (error) {
        console.error("❌ Error parsing JSON:", error.message);
        process.exit(1);
      }
    });
  })
  .on("error", (error) => {
    console.error("❌ Error fetching from R2:", error.message);
    process.exit(1);
  });
