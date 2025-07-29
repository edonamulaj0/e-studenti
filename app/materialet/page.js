import fs from "fs/promises";
import path from "path";
import MaterialsClient from "./materials-client";

// async function to fetch data at build time
async function getMaterialsData() {
  const filePath = path.join(process.cwd(), "app", "data", "materials.json");
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error reading materials.json:", error);
    return [];
  }
}

export default async function MaterialsPage() {
  const allMaterials = await getMaterialsData();

  return (
    <MaterialsClient initialMaterials={allMaterials} />
  );
}
