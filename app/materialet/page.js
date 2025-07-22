// app/materialet/page.js
// This remains a Server Component to fetch data at build time.
// No "use client" here.

import fs from "fs/promises";
import path from "path";
import MaterialsClient from "./materials-client"; // Import the new client component

// Async function to fetch data at build time
async function getMaterialsData() {
  const filePath = path.join(process.cwd(), "app", "data", "materials.json"); // Adjust path if your JSON file is elsewhere
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading materials.json:", error);
    // Return an empty array or handle the error gracefully
    return [];
  }
}

export default async function MaterialsPage() {
  // Renamed to MaterialsPage to avoid confusion
  const allMaterials = await getMaterialsData();

  return (
    // Pass the fetched data as a prop to the client component
    <MaterialsClient initialMaterials={allMaterials} />
  );
}
