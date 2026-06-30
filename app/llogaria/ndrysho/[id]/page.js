import { Suspense } from "react";
import EditMaterialClient from "./EditMaterialClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function NdryshoMaterialPage({ params }) {
  return (
    <Suspense fallback={null}>
      <EditMaterialClient id={params.id} />
    </Suspense>
  );
}
