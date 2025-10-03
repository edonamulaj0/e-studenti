#!/usr/bin/env node

/**
 * Local webhook server for auto-sync and deploy
 * This runs on your local machine and listens for sync requests from the admin UI
 *
 * Usage: node webhook-server.js
 * Then it will run on http://localhost:3001
 */

const http = require("http");
const { exec } = require("child_process");
const path = require("path");

const PORT = 3001;
const PROJECT_DIR = __dirname;

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Handle sync request
  if (req.url === "/sync" && req.method === "POST") {
    console.log("\n🔄 Sync request received from admin UI...");

    res.writeHead(200, corsHeaders);
    res.write(
      JSON.stringify({ status: "started", message: "Sync process started..." })
    );
    res.end();

    // Run sync and deploy script
    const command =
      process.platform === "win32"
        ? `powershell -File "${path.join(PROJECT_DIR, "quick-deploy.ps1")}"`
        : `bash ${path.join(PROJECT_DIR, "quick-deploy.sh")}`;

    console.log("📦 Running sync and deploy...");

    exec(command, { cwd: PROJECT_DIR }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        console.error(stderr);
        return;
      }

      console.log(stdout);
      console.log("✅ Sync and deploy completed!");
    });

    return;
  }

  // Handle status check
  if (req.url === "/status" && req.method === "GET") {
    res.writeHead(200, corsHeaders);
    res.end(
      JSON.stringify({
        status: "running",
        message: "Webhook server is running",
        port: PORT,
      })
    );
    return;
  }

  // 404 for other routes
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log("\n🚀 Webhook server started!");
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log("\n📝 Instructions:");
  console.log("   1. Keep this server running while using the admin UI");
  console.log('   2. Click "Save & Deploy" in the admin UI');
  console.log("   3. Changes will auto-sync and push to GitHub");
  console.log("\n⏹️  Press Ctrl+C to stop\n");
});
