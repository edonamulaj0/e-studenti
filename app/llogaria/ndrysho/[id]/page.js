import EditMaterialClient from "./EditMaterialClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function NdryshoMaterialPage({ params }) {
  return <EditMaterialClient id={params.id} />;
}
