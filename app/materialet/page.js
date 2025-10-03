import MaterialsClient from "./materials-client";

// Force dynamic rendering and revalidate every request
export const dynamic = "force-dynamic";
export const revalidate = 0;

// async function to fetch data from R2 at build time
async function getMaterialsData() {
  try {
    // Fetch from R2 via the worker's public URL
    const response = await fetch(
      "https://r2-catalog-manager.edonaamulaj.workers.dev?action=get",
      {
        cache: "no-store", // Ensure we get fresh data
      }
    );

    if (!response.ok) {
      console.error("Error fetching materials from R2:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error("Error fetching materials from R2:", error);
    return [];
  }
}

export default async function MaterialsPage() {
  const allMaterials = await getMaterialsData();

  return <MaterialsClient initialMaterials={allMaterials} />;
}
