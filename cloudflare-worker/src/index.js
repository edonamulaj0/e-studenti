import { unzipSync } from "fflate";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    try {
      switch (action) {
        case "generate":
          return await handleGenerate(env);
        case "merge":
          return await handleMerge(request, env);
        case "get":
          return await handleGet(env);
        case "delete":
          return await handleDelete(url, env);
        case "zipPreview":
          return await handleZipPreview(url, env);
        case "download":
          return await handleDownload(url, env);
        case "preview":
          return await handlePreview(url, env);
        default:
          return jsonResponse({ error: "Invalid action" }, 400);
      }
    } catch (error) {
      console.error("Error:", error);
      return jsonResponse({ error: error.message }, 500);
    }
  },
};

// Helper function to create JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// Extract file extension from filename
function getFileExtension(filename) {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : "unknown";
}

// Detect file type from extension
function detectFileType(filename) {
  const ext = getFileExtension(filename);
  const typeMap = {
    pdf: "pdf",
    zip: "zip",
    rar: "rar",
    doc: "doc",
    docx: "docx",
    ppt: "ppt",
    pptx: "pptx",
    xls: "xls",
    xlsx: "xlsx",
    txt: "txt",
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
  };
  return typeMap[ext] || "other";
}

// Generate title from filename
function generateTitle(filename) {
  // Remove extension
  let title = filename.replace(/\.[^.]+$/, "");
  // Replace URL encoding
  title = decodeURIComponent(title);
  // Replace special characters with spaces
  title = title.replace(/[_-]/g, " ");
  return title;
}

// Normalize URL for comparison - decode then re-encode consistently
function normalizeUrl(url) {
  try {
    // Get just the filename part after the domain
    const parts = url.split("media.e-studenti.com/");
    if (parts.length < 2) return url;

    // Decode any existing encoding, then encode consistently
    const filename = decodeURIComponent(parts[1]);
    return `https://media.e-studenti.com/${encodeURIComponent(filename)}`;
  } catch (e) {
    return url;
  }
}

// Helper function to check if an entry is complete
function isEntryComplete(entry) {
  return (
    entry.title &&
    entry.faculty &&
    entry.type &&
    entry.subject &&
    entry.r2Url &&
    entry.faculty !== "" &&
    entry.type !== "" &&
    entry.subject !== ""
  );
}

// Generate skeleton JSON from R2 bucket contents
async function handleGenerate(env) {
  const errors = []; // Track errors for debugging

  try {
    // Get existing catalog from your website's materials.json
    let existingCatalog = [];
    try {
      // Try to fetch from your deployed website first
      const websiteResponse = await fetch(
        "https://e-studenti.com/data/materials.json"
      );
      if (websiteResponse.ok) {
        existingCatalog = await websiteResponse.json();
        console.log(
          `Loaded ${existingCatalog.length} entries from website catalog`
        );
      } else {
        // Website returned non-OK status, try R2
        errors.push(`Website fetch status: ${websiteResponse.status}`);
        throw new Error(`Website returned ${websiteResponse.status}`);
      }
    } catch (e) {
      errors.push(`Website fetch error: ${e.message}`);
      console.log("Could not fetch from website, trying R2...");
      try {
        // Fallback to R2 if website fetch fails
        const catalogObj = await env.MY_BUCKET.get("data/materials.json");
        if (catalogObj) {
          const catalogText = await catalogObj.text();
          existingCatalog = JSON.parse(catalogText);
          console.log(
            `Loaded ${existingCatalog.length} entries from R2 catalog`
          );
        } else {
          errors.push("data/materials.json not found in R2");
          console.log("data/materials.json not found in R2");
        }
      } catch (e2) {
        errors.push(`R2 fetch error: ${e2.message}`);
        console.log(`Error loading from R2: ${e2.message}`);
      }
    }

    // Create a map of existing entries by r2Url for quick lookup
    // We'll match by the URL-encoded filename to handle spaces (%20)
    const existingMap = new Map();
    existingCatalog.forEach((entry) => {
      // Extract filename from URL: https://media.e-studenti.com/filename.ext
      // The URL format is: media.e-studenti.com/filename.extension
      const urlParts = entry.r2Url.split("media.e-studenti.com/");
      if (urlParts.length === 2) {
        // Use the URL-encoded filename as-is (spaces are %20)
        const encodedFilename = urlParts[1];
        const mapKey = encodedFilename.toLowerCase();
        existingMap.set(mapKey, entry);

        // Log first few entries for debugging
        if (existingMap.size <= 3) {
          console.log(
            `Map entry ${existingMap.size}: "${mapKey}" -> id:${
              entry.id
            }, complete:${isEntryComplete(entry)}`
          );
        }
      }
    });

    console.log(`Created map with ${existingMap.size} entries from catalog`);

    // List all objects in R2
    const listed = await env.MY_BUCKET.list();
    const allEntries = [];
    const incompleteEntries = [];
    const completeEntries = [];
    let maxId = Math.max(0, ...existingCatalog.map((e) => e.id || 0));

    console.log(`Found ${listed.objects.length} objects in R2`);

    let matchCount = 0;
    let mismatchCount = 0;

    for (const obj of listed.objects) {
      // Skip the catalog file itself
      if (obj.key === "data/materials.json") continue;

      const r2Url = `https://media.e-studenti.com/${encodeURIComponent(
        obj.key
      )}`;

      // Match by URL-encoded filename (spaces become %20) to match materials.json format
      const encodedFilename = encodeURIComponent(obj.key).toLowerCase();
      const existingEntry = existingMap.get(encodedFilename);

      // Log first few R2 files for debugging
      if (
        listed.objects.indexOf(obj) < 3 &&
        obj.key !== "data/materials.json"
      ) {
        console.log(
          `R2 file ${
            listed.objects.indexOf(obj) + 1
          }: "${encodedFilename}" -> Found in map: ${!!existingEntry}`
        );
      }

      if (existingEntry) {
        matchCount++;
        // Log first match for debugging
        if (matchCount === 1) {
          console.log(
            `First match: "${encodedFilename}" -> id:${
              existingEntry.id
            }, Complete: ${isEntryComplete(existingEntry)}`
          );
        }

        // Check if the entry is complete
        if (isEntryComplete(existingEntry)) {
          // Entry is complete - keep as is, just add fileType if missing
          completeEntries.push({
            ...existingEntry,
            fileType: existingEntry.fileType || detectFileType(obj.key),
          });
          allEntries.push({
            ...existingEntry,
            fileType: existingEntry.fileType || detectFileType(obj.key),
          });
        } else {
          // Entry exists but incomplete - mark for filling
          const incompleteEntry = {
            ...existingEntry,
            fileType: existingEntry.fileType || detectFileType(obj.key),
            _needsFilling: true,
            _filename: obj.key,
            _size: obj.size,
            _uploaded: obj.uploaded,
          };
          incompleteEntries.push(incompleteEntry);
          allEntries.push(incompleteEntry);
        }
      } else {
        // Create new skeleton entry for files not in catalog
        maxId++;
        const fileType = detectFileType(obj.key);
        const newEntry = {
          id: maxId,
          title: generateTitle(obj.key),
          faculty: "",
          department: "//",
          type: "",
          subject: "",
          teacher: "//",
          r2Url: r2Url,
          fileType: fileType,
          _needsFilling: true,
          _filename: obj.key,
          _size: obj.size,
          _uploaded: obj.uploaded,
          _isNew: true,
        };
        incompleteEntries.push(newEntry);
        allEntries.push(newEntry);
        mismatchCount++;
      }
    }

    console.log(
      `Matches: ${matchCount}, Mismatches: ${mismatchCount}, Complete: ${completeEntries.length}, Incomplete: ${incompleteEntries.length}`
    );

    // Collect debug info
    const mapKeys = Array.from(existingMap.keys()).slice(0, 5);
    const r2Keys = listed.objects
      .filter((o) => o.key !== "data/materials.json")
      .slice(0, 5)
      .map((o) => o.key.toLowerCase());

    return jsonResponse({
      success: true,
      total: allEntries.length,
      complete: completeEntries.length,
      incomplete: incompleteEntries.length,
      new: allEntries.filter((e) => e._isNew).length,
      entries: allEntries,
      summary: {
        message: `Found ${allEntries.length} files in R2: ${completeEntries.length} complete, ${incompleteEntries.length} need attention`,
      },
      debug: {
        catalogSize: existingCatalog.length,
        mapSize: existingMap.size,
        r2ObjectCount: listed.objects.length,
        sampleMapKeys: mapKeys,
        sampleR2Keys: r2Keys,
        matchCount,
        mismatchCount,
        errors,
      },
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Merge and save catalog to R2
async function handleMerge(request, env) {
  try {
    const data = await request.json();

    if (!Array.isArray(data.entries)) {
      return jsonResponse({ error: "Invalid data format" }, 400);
    }

    // Clean entries: remove helper fields
    const cleanedEntries = data.entries.map((entry) => {
      const { _needsFilling, _filename, _size, _uploaded, ...cleanEntry } =
        entry;
      return cleanEntry;
    });

    // Save to R2
    const catalogJson = JSON.stringify(cleanedEntries, null, 2);
    await env.MY_BUCKET.put("data/materials.json", catalogJson, {
      httpMetadata: {
        contentType: "application/json",
      },
    });

    return jsonResponse({
      success: true,
      message: "Catalog saved successfully",
      entriesSaved: cleanedEntries.length,
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Get current catalog
async function handleGet(env) {
  try {
    const catalogObj = await env.MY_BUCKET.get("data/materials.json");

    if (!catalogObj) {
      return jsonResponse({ entries: [] });
    }

    const catalogText = await catalogObj.text();
    const catalog = JSON.parse(catalogText);

    return jsonResponse({ entries: catalog });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Delete an object from R2
async function handleDelete(url, env) {
  try {
    const key = url.searchParams.get("key");

    if (!key) {
      return jsonResponse({ error: "Missing key parameter" }, 400);
    }

    // Delete the object from R2
    await env.MY_BUCKET.delete(key);

    // Also update the materials.json to remove this entry
    try {
      const catalogObj = await env.MY_BUCKET.get("data/materials.json");
      if (catalogObj) {
        const catalogText = await catalogObj.text();
        let catalog = JSON.parse(catalogText);

        // Remove the entry with matching filename
        const urlToMatch = `https://media.e-studenti.com/${encodeURIComponent(
          key
        )}`;
        catalog = catalog.filter((entry) => entry.r2Url !== urlToMatch);

        // Save updated catalog
        await env.MY_BUCKET.put(
          "data/materials.json",
          JSON.stringify(catalog, null, 2),
          {
            httpMetadata: {
              contentType: "application/json",
            },
          }
        );
      }
    } catch (catalogError) {
      console.error("Error updating catalog:", catalogError);
      // Continue even if catalog update fails
    }

    return jsonResponse({
      success: true,
      message: `Successfully deleted ${key}`,
      key: key,
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Preview ZIP file contents
async function handleZipPreview(url, env) {
  try {
    const filePath = url.searchParams.get("file");
    if (!filePath) {
      return jsonResponse({ error: "File path required" }, 400);
    }

    // Decode the file path
    const decodedPath = decodeURIComponent(filePath);

    // Get the file from R2
    const obj = await env.MY_BUCKET.get(decodedPath);
    if (!obj) {
      return jsonResponse({ error: "File not found" }, 404);
    }

    // Read the ZIP file
    const arrayBuffer = await obj.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Unzip to get file list
    let unzipped;
    try {
      unzipped = unzipSync(uint8Array);
    } catch (e) {
      return jsonResponse({ error: "Invalid or corrupted ZIP file" }, 400);
    }

    // Build file structure
    const files = [];
    let totalSize = 0;
    const fileLimit = 1000; // Limit to prevent huge responses

    for (const [filename, data] of Object.entries(unzipped)) {
      if (files.length >= fileLimit) break;

      const size = data.byteLength;
      totalSize += size;

      files.push({
        path: filename,
        size: size,
        sizeFormatted: formatBytes(size),
        isFolder: filename.endsWith("/"),
      });
    }

    // Sort: folders first, then alphabetically
    files.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.path.localeCompare(b.path);
    });

    return jsonResponse({
      success: true,
      filename: decodedPath.split("/").pop(),
      totalFiles: files.length,
      totalSize: totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      limitReached: Object.keys(unzipped).length > fileLimit,
      files: files,
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// Force download file
async function handleDownload(url, env) {
  try {
    const filePath = url.searchParams.get("file");
    if (!filePath) {
      return new Response("File path required", { status: 400 });
    }

    const decodedPath = decodeURIComponent(filePath);
    const obj = await env.MY_BUCKET.get(decodedPath);

    if (!obj) {
      return new Response("File not found", { status: 404 });
    }

    // Extract filename from path
    const filename = decodedPath.split("/").pop();

    // Return with attachment headers to force download
    return new Response(obj.body, {
      headers: {
        "Content-Type":
          obj.httpMetadata?.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": obj.size,
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

// Handle preview based on file type
async function handlePreview(url, env) {
  try {
    const filePath = url.searchParams.get("file");
    if (!filePath) {
      return new Response("File path required", { status: 400 });
    }

    const decodedPath = decodeURIComponent(filePath);
    const obj = await env.MY_BUCKET.get(decodedPath);

    if (!obj) {
      return new Response("File not found", { status: 404 });
    }

    const fileType = detectFileType(decodedPath);

    // For PDFs, allow inline viewing
    if (fileType === "pdf") {
      return new Response(obj.body, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          "Content-Length": obj.size,
          ...corsHeaders,
        },
      });
    }

    // For other files, return file info as JSON
    return jsonResponse({
      filename: decodedPath.split("/").pop(),
      fileType: fileType,
      size: obj.size,
      sizeFormatted: formatBytes(obj.size),
      previewAvailable: false,
      message: "Preview not available for this file type",
    });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
}

// Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
