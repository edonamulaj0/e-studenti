import fs from "fs/promises";
import path from "path";
import MaterialsClient from "./materials-client";

// async function to fetch data at build time from local file
async function getMaterialsData() {
  const filePath = path.join(process.cwd(), "app", "data", "materials.json");
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(fileContent);
    console.log(
      `[Materials Page] Loaded ${data.length} materials from ${filePath}`
    );
    return data;
  } catch (error) {
    console.error("Error reading materials.json:", error);
    return [];
  }
}

export default async function MaterialsPage() {
  const allMaterials = await getMaterialsData();

  return <MaterialsClient initialMaterials={allMaterials} />;
}
